var commonImport = require("./common/utils");
var setMultiLevel = commonImport.hierarchicSet;

/**
 * Creates function that accepts msg, modifies msg and a reference to array. Array should contain msg copies for editing.
 * @param config
 */
function createAdditionalHandlerFunction(config) {
    var toReturn = null;
    const directOutput = config.howSend.type === "full";
    const isMultiMsg = config.dropdown_HowManyMessages === "multiple";
    const isValueOnly = config.dropdownObjOrVal === "value" && isMultiMsg;
    let toMsgOutputModified = !directOutput ? config.howSend.text +
        (isValueOnly ? "" : ".") : "";
    if (isValueOnly) {
        if (isMultiMsg && directOutput) {
            toMsgOutputModified = "payload";
        }
        toReturn = function (msg, copyArray, key, value) {
            setMultiLevel(toMsgOutputModified, value, msg, true);
        }
    } else {
        toReturn = function (msg, copyArray, key, value) {
            setMultiLevel(toMsgOutputModified + key, value, msg, true);
        }
    }
    return toReturn;
}


module.exports = function (RED) {
    /**
     * This gets called on deploy action.
     * @param config Node config, including defaults created in HTML.
     */
    function SetDefaultsNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        function informError(e, customText, errtype, msg) {
            e.customErrorMessage = customText;
            e._errtype = errtype;
            e.originalMsg = msg;
            node.error(e.customErrorMessage, e);
        }

        node.on('input', function (msg) {

                // Additional handler gets created when we get message. Depending on how we are supposed to send to msg.
                var additionalHandler = null;
                if (config.chbox_DoOutputToMessage) {
                    additionalHandler = createAdditionalHandlerFunction(config);
                }

                /**
                 * Function that gets returned by getSetter in specific cases.
                 */
                function globalOrFlowSetter(obj, key, value) {
                    obj.set(key, value);
                }

                /**
                 * Function that gets returned by getGetter in specific cases.
                 */
                function globalOrFlowGetter(obj, key) {
                    return obj.get(key);
                }

                /**
                 * Returns getter for msg or flow or global.
                 * @param whatFor string, "msg", "flow" or "global"
                 * @returns getter function
                 */
                function getGetter(whatFor) {
                    if (whatFor === "flow" || whatFor === "global") {
                        return globalOrFlowGetter;
                    }
                    return commonImport.defaultGetter;
                }

                /**
                 * Returns setter for msg or flow or global.
                 * @param whatFor string, "msg", "flow" or "global"
                 * @returns setter function
                 */
                function getSetter(whatFor) {
                    if (whatFor === "flow" || whatFor === "global") {
                        return globalOrFlowSetter;
                    }
                    return commonImport.defaultSetter;
                }

                if (config.dropdown_HowManyMessages === "multiple") {
                    try {
                        let msgCopy = JSON.stringify(msg);
                        var returns = Array.from(new Array(config.rules.length), () => JSON.parse(msgCopy));
                    } catch (e) {
                        msg.innerError = e;
                        node.error("Unable to copy message for multi-output mode. Message must be able to be JSONed.", msg);
                        return null;
                    }
                } else {
                    // Single message - each msg object in array should be same.
                    var returns = new Array(config.rules.length);
                    returns.fill(msg);
                }


                config.rules.forEach(function (rule, ruleIndex) {
                    var setTo = rule.pt === "flow" ? node.context().flow :
                        rule.pt === "global" ? node.context().global : returns[ruleIndex];
                    let potentialNewValue = rule.to;
                    switch (rule.tot) {
                        case "num":
                            potentialNewValue = Number(potentialNewValue);
                            break;
                        case "to_undefined":
                            potentialNewValue = undefined;
                            try {
                                commonImport.dummyDeleteDeep(setTo, rule.p, getGetter(rule.pt), getSetter(rule.pt));
                            } catch (e) {
                                node.log("Clearing the value failed. Possibly the property does not exist.");
                                node.trace(e.stack);
                            }
                            break;
                        case "bool":
                            potentialNewValue = ("true" === potentialNewValue);
                            break;
                        case "json":
                            try {
                                potentialNewValue = JSON.parse(potentialNewValue);
                            }catch (e) {
                                e.message = "json_parse: " + e.message;
                                node.error(e, msg);
                                potentialNewValue = undefined;
                            }
                            break;
                        case "jsonata":
                            try {
                                const jsonata = RED.util.prepareJSONataExpression(potentialNewValue, node);
                                potentialNewValue = RED.util.evaluateJSONataExpression(jsonata, msg);
                            } catch (e) {
                                console.log(e);
                                // Errors from jsonata get reported and handled by node-red differently. So we use different way of handling them.
                                informError(e, "Jsonata expression problem. Rule: " + JSON.stringify(rule), "jsonata", msg);
                                potentialNewValue = undefined;
                            }
                            break;
                        case "msg":
                            try {
                                potentialNewValue = commonImport.dummyGetDeep(msg, potentialNewValue);
                            } catch (e) {
                                e.message = "msg_reading: " + e.message;
                                node.error(e, msg);
                                potentialNewValue = undefined;
                            }
                            break;
                        case "flow":
                        case "global":
                            const f_or_g = rule.tot === "flow" ? node.context().flow : node.context().global;
                            try {
                                potentialNewValue = commonImport.dummyGetDeep(f_or_g, potentialNewValue, globalOrFlowGetter)
                            } catch (e) {
                                e.message = "context_reading: " + e.message;
                                node.error(e, msg);
                                potentialNewValue = undefined;
                            }
                            break;
                        case "date":
                            potentialNewValue = Date.now();
                            break;
                        case "bin":
                            try {
                                potentialNewValue = Buffer.from(JSON.parse(rule.to));
                            } catch (e) {
                                e.message = "bin_field: " + e.message;
                                node.error(e, msg);
                                potentialNewValue = undefined;
                            }
                            break;
                        default:
                            break;
                    }
                    if (setMultiLevel(rule.p, potentialNewValue, setTo, false, getSetter(rule.pt), getGetter(rule.pt)).modified) {
                        if (additionalHandler != null && rule.pt !== "msg") {
                            additionalHandler(returns[ruleIndex], returns, rule.p, potentialNewValue);
                        }
                    } else if (config.chbox_SetCurrentToMsg) {
                        if (additionalHandler != null && rule.pt !== "msg") {
                            // additionalHandler parameters: objectToSet, returnsArray, key, value to set
                            additionalHandler(returns[ruleIndex], returns, rule.p, commonImport.dummyGetDeep(setTo, rule.p, globalOrFlowGetter));
                        }
                    }
                });
                if (config.dropdown_HowManyMessages === "multiple") {
                    node.send(returns);
                } else {
                    node.send(msg);
                }
            }
        );
    }
    RED.nodes.registerType("set-defaults", SetDefaultsNode);
};