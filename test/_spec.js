// Example things to put into package:
// "test": "mocha --grep \"should set multilevel flow global and msg 2_nr2\" \"test/**/*_spec.js\""
// "test": "mocha \"test/**/*_spec.js\""

var should = require("should");
var helper = require("node-red-node-test-helper");
var setDefaultsNodeClass = require("../set-defaults.js");
var testFlows = require("./flowDeclarations");

helper.init(require.resolve('node-red'));

function dropMsgId(msg) {
    delete msg._msgid;
    return msg;
}

function commonMsgTestSimple() {
    return {payload: "simple"};
}

function getCoolMsg() {
    return {payload: "cool"};
}

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Allows to copy paste flow from node-red to javascript without change. Converts flow's "link out" node to "helper".
 * @param obj flow.
 * @returns modified flow that uses helper node.
 */
function convertLinkOut(obj) {
    try {
        while (theobj = obj.find(x => x.type === "link out").type = "helper") {
            theobj.type = "helper";
        }
    } catch (e) {
    }
    return obj;
}

/**
 * Tests are numbered (example 1_nr3) according to my developing notes.
 */
describe('set-defaults Node', function () {

    afterEach(function () {
        helper.unload();
    });

    it('should be loaded', function (done) {
        var flow = [{id: "n1", type: "set-defaults", name: "set-defaults"}];
        helper.load(setDefaultsNodeClass, flow, function () {
            var n1 = helper.getNode("n1");
            n1.should.have.property('name', 'set-defaults');
            done();
        });
    });

    /**
     * Simple test that just passes MSG.
     */
    it('should pass msg', function (done) {
        // Infos tests are async .. we want to lower the value so we wait less in case of faliure
        this.timeout(500);
        // @formatter:off
        var flow = [{"id":"f2b1ce50.49326","type":"set-defaults","z":"7476329e.ee717c","name":"ntest0","rules":[],"chbox_DoOutputToMessage":false,"howSend":{"text":"payload","type":"msg","modifiedValue":"payload"},"dropdown_HowManyMessages":"single","dropdownObjOrVal":"value","x":180,"y":380,"wires":[["e84549ef.ed47a8"]]},{"id":"e84549ef.ed47a8","type":"helper","z":"7476329e.ee717c","name":"sinkNode"}];
        // @formatter:on
        helper.load(setDefaultsNodeClass, flow, function () {
            var sdnode = helper.getNode("f2b1ce50.49326");
            var sinkNode = helper.getNode("e84549ef.ed47a8");
            sinkNode.on("input", function (msg) {
                // MSG unchanged
                // infos way 1 of comparing things
                msg.should.have.property('payload', 'simple');
                // infos way 2 of comparing things
                should.equal(msg.payload, "simple");
                should.equal(JSON.stringify(dropMsgId(msg)), JSON.stringify(commonMsgTestSimple()));
                done();
            });
            sdnode.receive(commonMsgTestSimple());
        });
    });

    it('should set flow parameters 1_nr1 and multi flow parameters 2_nr1', function (done) {
        this.timeout(210);
        // @formatter:off
        var flow = testFlows.flow1_nr1;
        // @formatter:on
        /**
         * // INFOS documentation of load function, copyPaste
         * Loads a flow then starts the flow.
         * @param testNode: (object|array of objects) Module object of a node to be tested returned by require function. This node will be registered, and can be used in testFlows.
         * @param testFlows: (array of objects) Flow data to test a node. If you want to use flow data exported from Node-RED editor, export the flow to the clipboard and paste the content into your test scripts.
         * @param testCredentials: (object) Optional node credentials.
         * @param cb: (function) Function to call back when testFlows has been started.
         */
        helper.load(setDefaultsNodeClass, flow, function () {
            var sdnode = helper.getNode("33a32fef.ee55a");
            var sinkNode = helper.getNode("37123412.258e6c");
            sinkNode.on("input", function (msg) {
                try {
                    should.equal(msg.payload, commonMsgTestSimple().payload);
                    // We are asserting that msg was really unchanged - nothing got added to it
                    should.equal(JSON.stringify(dropMsgId(msg)), JSON.stringify(commonMsgTestSimple()));
                    sinkNode.context().flow.get("first").should.equal("v1");
                    sinkNode.context().flow.get("msg").devil.should.equal("funny");
                    // Make sure global is unchanged .. 2 different ways of should
                    should.not.exist(sinkNode.context().global.get("first"));
                    (sinkNode.context().global.get("msg") === undefined).should.be.true();
                    done();
                } catch (e) {
                    console.log(e.message + "\n" + e.stack);
                }
            });
            sdnode.receive(commonMsgTestSimple());
        });
    });

    it("should set flow global and msg 1_nr2", function (done) {
        this.timeout(1200);
        // @formatter:off
        var flow = testFlows.flow1_nr2;
        // @formatter:on
        helper.load(setDefaultsNodeClass, flow, function () {
            var sinkNode = helper.getNode("a19f4517.9aafc8");
            var testedNode = helper.getNode("37a0859f.e88a9a");
            sinkNode.on("input", function (msg) {
                try {
                    // EXPECTING: {payload:simple, tstt:{first:v2, second:never, third:glob}}
                    msg.should.have.property("payload", "simple");
                    var tstt = msg.tstt;
                    // Ensure tstt is not undefined
                    should.exist(tstt);
                    tstt.should.have.property("first", "v2");
                    tstt.should.have.property("second", "never");
                    tstt.should.have.property("third", "glob");

                    sinkNode.context().flow.get("first").should.equal("v2");
                    sinkNode.context().flow.get("second").should.equal("never");
                    sinkNode.context().global.get("third").should.equal("glob");
                    done();
                } catch (e) {
                    console.log(e.message + "\n" + e.stack);
                }
            });
            testedNode.receive(commonMsgTestSimple());
        });
    });

    it("should set multilevel flow global and msg 2_nr2", function (done) {
        this.timeout(1200);
        // @formatter:off
        var flow = [{"id":"5285737e.3c9c6c","type":"set-defaults","z":"7476329e.ee717c","name":"t22n","rules":[{"p":"first","pt":"flow","to":"v2","tot":"str"},{"p":"second","pt":"flow","to":"never","tot":"str"},{"p":"third","pt":"global","to":"glob","tot":"str"},{"p":"second1.smthElse","pt":"flow","to":"complicated","tot":"str"},{"p":"second1.finisher","pt":"flow","to":"awsome","tot":"str"},{"p":"h1.h2.h3","pt":"global","to":"hierarchy","tot":"str"}],"chbox_DoOutputToMessage":true,"howSend":{"text":"tstt","type":"msg","modifiedValue":"tstt"},"dropdown_HowManyMessages":"single","dropdownObjOrVal":"value","x":230,"y":260,"wires":[["a19f4517.9aafc8"]]},{"id":"a19f4517.9aafc8","type":"helper","z":"7476329e.ee717c","name":"sinkNode","x":335,"y":320,"wires":[]}];
        // @formatter:on
        helper.load(setDefaultsNodeClass, flow, function () {
            var sinkNode = helper.getNode("a19f4517.9aafc8");
            var testedNode = helper.getNode("5285737e.3c9c6c");
            sinkNode.on("input", function (msg) {
                // EXPECTING: {"payload":"simple","tstt":{"first":"v2","second":"never","third":"glob","second1":{"smthElse":"complicated","finisher":"awsome"},"h1":{"h2":{"h3":"hierarchy"}}}}"
                msg.should.have.property("payload", "simple");

                var tstt = msg.tstt;
                // Ensure tstt is not undefined
                should.exist(tstt);
                tstt.should.have.property("first", "v2");
                tstt.should.have.property("second", "never");
                tstt.should.have.property("third", "glob");

                var second1 = msg.tstt.second1;
                //    console.log(JSON.stringify(msg));
                should.exist(second1);
                should.equal(JSON.stringify(second1), JSON.stringify({smthElse: "complicated", finisher: "awsome"}));

                sinkNode.context().flow.get("first").should.equal("v2");
                sinkNode.context().flow.get("second").should.equal("never");
                sinkNode.context().global.get("third").should.equal("glob");

                var flowSecond1 = sinkNode.context().flow.get("second1");
                should.exist(flowSecond1);
                should.equal(JSON.stringify(flowSecond1), JSON.stringify({
                    smthElse: "complicated",
                    finisher: "awsome"
                }));

                var globalH1 = sinkNode.context().global.get("h1");
                should.exist(globalH1);
                should.equal(globalH1.h2.h3, "hierarchy");
                should.equal(tstt.h1.h2.h3, "hierarchy");
                done();
            });
            testedNode.receive(commonMsgTestSimple());
        });
    });

    it("should set msg and flow and msg explicit, multilevel, 1_nr8 and 2_nr8", function (done) {
        this.timeout(1200);
        var flow = testFlows.flow1_nr8;
        helper.load(setDefaultsNodeClass, flow, function () {
            var sinkNode = helper.getNode("a19f4517.9aafc8");
            var testedNode = helper.getNode("cc370ec6.87ef3");
            sinkNode.on("input", function (msg) {
                    try {
                        // EXPECTING: {payload:added, second:never, r3:last}
                        sinkNode.context().flow.get("first").should.equal("v2");
                        msg.should.have.property("payload", "added");
                        msg.should.have.property("second", "never");
                        msg.should.have.property("r3", "last");
                        msg.should.have.property("items");
                        msg.items.one.should.equal(112);
                        JSON.stringify(msg.items.two).should.equal("{\"what\":\"is\",\"this\":\"rly\"}");
                        done();
                    }
                    catch (e) {
                        console.log("Error", e.message + "\n" + e.stack);
                    }
                }
            );
            testedNode.receive({payload: "added"});
        });
    });

    it('should set only if not set already 3_nr1', function (done) {
        this.timeout(160);
        var flow = testFlows.flow1_nr1;
        helper.load(setDefaultsNodeClass, flow, function () {
            var sdnode = helper.getNode("33a32fef.ee55a");
            var sinkNode = helper.getNode("37123412.258e6c");
            sinkNode.context().flow.set("first", "vts");
            sinkNode.on("input", function (msg) {
                // MSG unchanged
                should.equal(msg.payload, commonMsgTestSimple().payload);
                should.equal(JSON.stringify(dropMsgId(msg)), JSON.stringify(commonMsgTestSimple()));
                sinkNode.context().flow.get("first").should.equal("vts");
                sinkNode.context().flow.get("msg").devil.should.equal("funny");
                // Make sure global is unchanged .. 2 different ways of should
                should.not.exist(sinkNode.context().global.get("first"));
                (sinkNode.context().global.get("msg") === undefined).should.be.true();
                done();
            });
            sdnode.receive(commonMsgTestSimple());
        });
    });

    it("should set global, msg only if not set already 3_nr2", function (done) {
        this.timeout(600);
        var flow = testFlows.flow3_nr2;
        helper.load(setDefaultsNodeClass, flow, function () {
            var sinkNode = helper.getNode("a19f4517.9aafc8");
            var testedNode = helper.getNode("1df478b.98abe87");
            sinkNode.on("input", function (msg) {
                // EXPECTING: {payload:simple, tstt:{first:v2, second:never, third:glob}}
                msg.should.have.property("payload", "simple");
                var tstt = msg.tstt;
                // Ensure tstt is not undefined
                should.exist(tstt);
                tstt.should.have.property("first", "v2");
                tstt.should.not.have.property("second", "never");
                sinkNode.context().flow.get("second").should.equal("finalflow");
                tstt.should.have.property("third", "glob");
                sinkNode.context().flow.get("first").should.equal("v2");
                sinkNode.context().global.get("third").should.equal("glob");
                msg.should.have.property("awsomness", "great");
                msg.should.have.property("unchangeable", "final");
                done();
            });
            sinkNode.context().flow.set("second", "finalflow");
            testedNode.receive({payload: "simple", unchangeable: "final", tstt: {first: "will change"}});
        });
    });

    var countCompleteTest = function (howMany, done) {
        --howMany;
        if (howMany === 0) {
            done();
        }
        return howMany;
    };

    it("should handle multiple outputs correctly - write value to some msg property 1_nr3", function (done) {
        this.timeout(600);
        var flow = testFlows.flow1_nr3;
        helper.load(setDefaultsNodeClass, flow, function () {
            var testedNode = helper.getNode("437132ae.d2f18c");
            var sink1 = helper.getNode("a19f4517.9aafc8");
            var sink2 = helper.getNode("5b74b409.864fac");
            var sink3 = helper.getNode("aff4587.nomr33");
            let counter = 3;
            // extension 3nr3: make sure value set before doesn't overwrite
            sink1.context().global.set("preset", 42);
            sink1.on("input", function (msg) {
                try {
                    // Value only to tstt
                    msg.should.have.property("tstt", "v2");
                    msg.should.have.property("payload", "simple");
                    sink1.context().flow.get("first").should.equal("v2");
                    counter = countCompleteTest(counter, done);
                }
                catch (e) {
                    console.log("Error", e.stack);
                    console.log("Error", e.name);
                    console.log("Error", e.message);
                }
            });
            sink2.on("input", function (msg) {
                    try {
                        // EXPECTING: {payload:simple, tstt:{first:v2, second:never, third:glob}}
                        msg.should.have.property("payload", "simple");
                        msg.should.have.property("tstt", "never");
                        sink2.context().flow.get("second").should.equal("never");
                        counter = countCompleteTest(counter, done);
                    }
                    catch (e) {
                        console.log("Error", e.stack);
                        console.log("Error", e.name);
                        console.log("Error", e.message);
                    }
                }
            );
            sink3.on("input", function (msg) {
                    try {
                        // msg unchanged
                        dropMsgId(msg);
                        JSON.stringify(msg).should.equal(JSON.stringify({
                            payload: "simple",
                            unchangeable: "final",
                            tstt: {first: "will change"}
                        }));
                        // global unchanged
                        sink3.context().global.get("preset").should.equal(42);
                        should.not.exist(sink3.context().flow.get("preset"));
                        counter = countCompleteTest(counter, done);
                    }
                    catch (e) {
                        console.log("Error", e.stack);
                        console.log("Error", e.name);
                        console.log("Error", e.message);
                    }
                }
            );
            testedNode.receive({payload: "simple", unchangeable: "final", tstt: {first: "will change"}});
        });
    });

    it("should handle multiple outputs correctly, key-value mode 1_nr4", function (done) {
        this.timeout(600);
        var flow = testFlows.flow1_nr4;
        helper.load(setDefaultsNodeClass, flow, function () {
            var testedNode = helper.getNode("437132ae.d2f18c");
            var sink1 = helper.getNode("a19f4517.9aafc8");
            var sink2 = helper.getNode("5b74b409.864fac");
            let counter = 2;
            sink1.on("input", function (msg) {
                try {
                    // Value only to tstt
                    msg.should.have.property("tstt");
                    msg.should.have.property("payload", "simple");
                    sink1.context().flow.get("first").should.equal("v2");
                    dropMsgId(msg);
                    JSON.stringify(msg).should.equal(JSON.stringify({
                        payload: "simple",
                        unchangeable: "final",
                        tstt: {first: "v2"}
                    }));
                    counter = countCompleteTest(counter, done);
                }
                catch (e) {
                    console.log("Error", e.stack);
                    console.log("Error", e.name);
                    console.log("Error", e.message);
                }
            });
            sink2.on("input", function (msg) {
                try {
                    // EXPECTING: {payload:simple, tstt:{first:v2, second:never, third:glob}}
                    msg.should.have.property("payload", "simple");
                    msg.should.have.property("tstt");
                    sink2.context().flow.get("second").should.equal("never");
                    dropMsgId(msg);
                    JSON.stringify(msg).should.equal(JSON.stringify({
                        payload: "simple",
                        unchangeable: "final",
                        tstt: {first: "will change", second: "never"}
                    }));
                    counter = countCompleteTest(counter, done);
                }
                catch (e) {
                    console.log("Error", e.stack);
                    console.log("Error", e.name);
                    console.log("Error", e.message);
                }
            });
            // sink.context().flow.set("second", "finalflow");
            testedNode.receive({payload: "simple", unchangeable: "final", tstt: {first: "will change"}});
        });
    });

    it("Should correctly handle single message directly to message mode 1_nr5", function (done) {
        this.timeout(600);
        var flow = testFlows.flow1_nr5;
        helper.load(setDefaultsNodeClass, flow, function () {
            var testedNode = helper.getNode("69396df6.eab124");
            var sink1 = helper.getNode("a19f4517.9aafc8");
            sink1.on("input", function (msg) {
                try {
                    sink1.context().flow.get("first").should.equal("kiw");
                    sink1.context().flow.get("second").should.equal("df");
                    dropMsgId(msg);
                    JSON.stringify(msg).should.equal(JSON.stringify({payload: "cool", first: "kiw", second: "df"}));
                    done();
                }
                catch (e) {
                    console.log("Error", e.message + "\n" + e.stack);
                }
            });
            testedNode.receive(getCoolMsg());
        });
    });

    it("Should handle multi-message, direct, value-only mode (value to payload) 1_nr6", function (done) {
        this.timeout(600);
        var flow = testFlows.flow1_nr6;
        helper.load(setDefaultsNodeClass, flow, function () {
            var testedNode = helper.getNode("2cb8bc25.dce4d4");
            var sink1 = helper.getNode("a19f4517.9aafc8");
            var sink2 = helper.getNode("5b74b409.864fac");
            let counter = 2;
            sink1.on("input", function (msg) {
                try {
                    sink1.context().flow.get("first").should.equal("kiw");
                    dropMsgId(msg);
                    JSON.stringify(msg).should.equal(JSON.stringify({payload: "kiw"}));
                    counter = countCompleteTest(counter, done);
                }
                catch (e) {
                    console.log("Error", e.message + "\n" + e.stack);
                }
            });
            sink2.on("input", function (msg) {
                try {
                    sink2.context().flow.get("second").should.equal("df");
                    dropMsgId(msg);
                    JSON.stringify(msg).should.equal(JSON.stringify({payload: "df"}));
                    counter = countCompleteTest(counter, done);
                }
                catch (e) {
                    console.log("Error", e.message + "\n" + e.stack);
                }
            });
            testedNode.receive(getCoolMsg());
        });
    });

    it("should handle rules in order, ignoring msg if already set 1_nr9,2_nr9", function (done) {
        this.timeout(600);
        var flow = testFlows.flow1_nr9;
        helper.load(setDefaultsNodeClass, flow, function () {
            var testedNode = helper.getNode("b4106913.2a26f8");
            var sink1 = helper.getNode("a19f4517.9aafc8");
            sink1.on("input", function (msg) {
                try {
                    sink1.context().flow.get("first").should.equal("v2");
                    dropMsgId(msg);
                    JSON.stringify(msg).should.equal(JSON.stringify({
                        "second": "always",
                        "r3": "last",
                        "first": "some string",
                        "someObject": {
                            "subobject": {"somestring": "str", "someint": 88114, "the_false": false},
                            "stringval": "actualString"
                        }
                    }));
                    done();
                }
                catch (e) {
                    console.log("Error", e.message + "\n" + e.stack);
                }
            });
            testedNode.receive({second: "always"});
        });
    });

    it("should correctly handle order, overwriting and priorities 3_nr8,5_nr8,3_nr9,5_nr9", function (done) {
        this.timeout(600);
        // very similiar to previous test. Just change last rule to set to flow - overwrites the message. And write rules work to message.
        var flow = deepCopy(testFlows.flow1_nr9);
        flow.find(x => x.name === "t19n").rules[11].pt = "flow";
        flow.find(x => x.name === "t19n").chbox_DoOutputToMessage = true;
        flow.find(x => x.name === "t19n").howSend.type = "full";
        helper.load(setDefaultsNodeClass, flow, function () {
            var testedNode = helper.getNode("b4106913.2a26f8");
            var sink1 = helper.getNode("a19f4517.9aafc8");
            sink1.on("input", function (msg) {
                try {
                    sink1.context().flow.get("first").should.equal("v2");
                    sink1.context().flow.get("someObject").should.equal("dropEverything");
                    dropMsgId(msg);
                    // @formatter:off
                    var comparator ={"second": "always","r3":"last","first":"v2","someObject": "dropEverything"};
                    JSON.stringify(msg, Object.keys(msg).sort()).should.equal(JSON.stringify(comparator, Object.keys(comparator).sort()));
                    // @formatter:on
                    done();
                }
                catch (e) {
                    console.log("Error", e.message + "\n" + e.stack);
                }
            });
            testedNode.receive({second: "always"});
        });
    });

    var confirmAllMsg = function (expecteds, receives) {
        receives.forEach(function (msg, msgIndex) {
            var i = 0;
            while (i < expecteds.length) {
                expecteds[i].should.equal(msg);
                if (expecteds[i] === msg) {
                    expecteds.splice(i, 1);
                    break;
                }
                ++i;
            }
        });
        return expecteds.length === 0;
    };

    // testname is only for debug purposes .. usually it is not filled.
    var multiOutputTest = function (flow, expecteds, expectedContext, msg, done, testName = "", nodeId = "6d742ca6.976614") {
        helper.load(setDefaultsNodeClass, flow, function () {
            var testedNode = helper.getNode(nodeId);
            var sink1 = helper.getNode("a19f4517.9aafc8");
            // Array of expected MSGs
            var cnt = expecteds.length;
            expecteds = expecteds.map(x => JSON.stringify(x));
            let receives = [];
            var finalize = function () {
                // Do we have all messages?
                confirmAllMsg(expecteds, receives).should.equal(true);
                // assert context
                for (expectation of expectedContext) {
                    expectation(sink1);
                }
                return true;
            };
            sink1.on("input", function (msg) {
                try {
                    dropMsgId(msg);
                    receives.push(JSON.stringify(msg));
                    --cnt;
                    if (cnt === 0) {
                        if (finalize()) {
                            done();
                        }
                    }
                }
                catch (e) {
                    console.log("Error", e.message + "\n" + e.stack);
                }
            });
            testedNode.receive(msg);
        });
    };

    it("should handle complicated hierarchical scenario 2_nr3, 3_nr3, 5_nr3", function (done) {
        this.timeout(850);
        var flow = deepCopy(testFlows.flow2_nr3);
        var expecteds = [
            {"payload": "simple", "tstt": "v2"},
            {"payload": "simple"},
            {"payload": "simple"},
            {"payload": "simple", "tstt": "v5"},
            {"payload": "simple", "tstt": "v6"},
            {"payload": "simple", "tstt": "v7"},
            {"payload": "simple", "tstt": "v8"},
            {"payload": "simple", "tstt": "terminated"}
        ];
        multiOutputTest(flow, expecteds, [
            // @formatter:off
            function (node) {node.context().global.get("first").advanced.should.equal("v5")},
            function (node) {node.context().flow.get("first").should.equal("v2")},
            function (node) { node.context().flow.get("xfirst").advanced.anotherobj.payload1.should.equal("terminated")},
            function (node) {JSON.stringify(node.context().flow.get("tree")).should.equal(JSON.stringify({first: {v1: "v6", v2: "v7"}, second: "v8"}))}
            // @formatter:on
        ], commonMsgTestSimple(), done);
    });

    it("should handle complicated hierarchical scenario key-value mode 2_nr4, 3_nr4, 5_nr4", function (done) {
        this.timeout(850);
        var flow = deepCopy(testFlows.flow2_nr3);
        // modify, Change write mode to key-value
        flow.find(x => x.name === "t23").dropdownObjOrVal = "keyValue";
        var expecteds = [
            {"payload": "simple", "tstt": {first: "v2"}},
            {"payload": "simple"},
            {"payload": "simple"},
            {"payload": "simple", "tstt": {first: {advanced: "v5"}}},
            {"payload": "simple", "tstt": {tree: {first: {v1: "v6"}}}},
            {"payload": "simple", "tstt": {tree: {first: {v2: "v7"}}}},
            {"payload": "simple", "tstt": {tree: {second: "v8"}}},
            {"payload": "simple", "tstt": {xfirst: {advanced: {anotherobj: {payload1: "terminated"}}}}}
        ];
        var testName = this.runnable().title;
        multiOutputTest(flow, expecteds, [
            // @formatter:off
            function (node) {node.context().global.get("first").advanced.should.equal("v5")},
            function (node) {node.context().flow.get("first").should.equal("v2")},
            function (node) { node.context().flow.get("xfirst").advanced.anotherobj.payload1.should.equal("terminated")},
            function (node) {JSON.stringify(node.context().flow.get("tree")).should.equal(JSON.stringify({first: {v1: "v6", v2: "v7"}, second: "v8"}))}
            // @formatter:on
        ], commonMsgTestSimple(), done, testName);
    });

    it("should handle complicated hierarchical scenario, single message 2_nr5, 3_nr5, 5_nr5", function (done) {
        this.timeout(850);
        var flow = deepCopy(testFlows.flow2_nr3);
        flow.find(x => x.name === "t23").dropdown_HowManyMessages = "single";
        flow.find(x => x.name === "t23").howSend.type = "full";
        flow.find(x => x.name === "t23").wires = flow.find(x => x.name === "t23").wires.slice(0, 1);
        var expecteds = [{
            "payload": "simple",
            first: {advanced: "v5"},
            tree: {first: {v1: "v6", v2: "v7"}, second: "v8"},
            xfirst: {advanced: {anotherobj: {payload1: "terminated"}}}
        }];
        multiOutputTest(flow, expecteds, [
            // @formatter:off
            function (node) {node.context().global.get("first").advanced.should.equal("v5")},
            function (node) {node.context().flow.get("first").should.equal("v2")},
            function (node) { node.context().flow.get("xfirst").advanced.anotherobj.payload1.should.equal("terminated")},
            function (node) {JSON.stringify(node.context().flow.get("tree")).should.equal(JSON.stringify({first: {v1: "v6", v2: "v7"}, second: "v8"}))}
            // @formatter:on
        ], commonMsgTestSimple(), done);
    });

    it("should handle complicated hierarchical scenario, where flow rule sets one object and msg sets another 5_nr52", function (done) {
        this.timeout(850);
        var flow = deepCopy(testFlows.flow2_nr3);
        flow.find(x => x.name === "t23").dropdown_HowManyMessages = "single";
        flow.find(x => x.name === "t23").howSend.type = "full";
        flow.find(x => x.name === "t23").wires = flow.find(x => x.name === "t23").wires.slice(0, 1);
        flow.find(x => x.name === "t23").rules[5].pt = "msg";
        var expecteds = [{
            "payload": "simple",
            first: {advanced: "v5"},
            tree: {first: {v1: "v6", v2: "v7"}, second: "v8"},
            xfirst: {advanced: {anotherobj: {payload1: "terminated"}}}
        }];
        multiOutputTest(flow, expecteds, [
            // @formatter:off
            function (node) {node.context().global.get("first").advanced.should.equal("v5")},
            function (node) {node.context().flow.get("first").should.equal("v2")},
            function (node) {node.context().flow.get("xfirst").advanced.anotherobj.payload1.should.equal("terminated")},
            function (node) {JSON.stringify(node.context().flow.get("tree")).should.equal(JSON.stringify({first: {v1: "v6"}, second: "v8"}))}
            // @formatter:on
        ], commonMsgTestSimple(), done, "whatevs");
    });

    it("should handle complicated hierarchical scenario, multimsg, direct, value only 2_nr6, 3_nr6, 5_nr6", function (done) {
        this.timeout(850);
        var flow = deepCopy(testFlows.flow2_nr3);
        flow.find(x => x.name === "t23").howSend.type = "full";
        flow.find(x => x.name === "t23").name = "t26";
        var expecteds = [
            {"payload": "v2"},
            {"payload": "simple"},
            {"payload": "simple"},
            {"payload": "v5"},
            {"payload": "v6"},
            {"payload": "v7"},
            {"payload": "v8"},
            {"payload": "terminated"}
        ];
        // Also send test title for debugging
        multiOutputTest(flow, expecteds, [
            // @formatter:off
            function (node) {node.context().global.get("first").advanced.should.equal("v5")},
            function (node) {node.context().flow.get("first").should.equal("v2")},
            function (node) { node.context().flow.get("xfirst").advanced.anotherobj.payload1.should.equal("terminated")},
            function (node) {JSON.stringify(node.context().flow.get("tree")).should.equal(JSON.stringify({first: {v1: "v6", v2: "v7"}, second: "v8"}))}
            // @formatter:on
        ], commonMsgTestSimple(), done, this.runnable().title);
    });

    it("should handle complicated hierarchical scenario, multimsg to message, keyValue 2_nr7, 3_nr7, 5_nr7", function (done) {
        this.timeout(850);
        var flow = deepCopy(testFlows.flow2_nr3);
        flow.find(x => x.name === "t23").howSend.type = "full";
        flow.find(x => x.name === "t23").dropdownObjOrVal = "keyValue";
        var expecteds = [
            {"payload": "simple", first: "v2"},
            {"payload": "simple"},
            {"payload": "simple"},
            {"payload": "simple", first: {advanced: "v5"}},
            {"payload": "simple", tree: {first: {v1: "v6"}}},
            {"payload": "simple", tree: {first: {v2: "v7"}}},
            {"payload": "simple", tree: {second: "v8"}},
            {"payload": "simple", xfirst: {advanced: {anotherobj: {payload1: "terminated"}}}}
        ];
        multiOutputTest(flow, expecteds, [
            // @formatter:off
            function (node) {node.context().global.get("first").advanced.should.equal("v5")},
            function (node) {node.context().flow.get("first").should.equal("v2")},
            function (node) { node.context().flow.get("xfirst").advanced.anotherobj.payload1.should.equal("terminated")},
            function (node) {JSON.stringify(node.context().flow.get("tree")).should.equal(JSON.stringify({first: {v1: "v6", v2: "v7"}, second: "v8"}))}
            // @formatter:on
        ], commonMsgTestSimple(), done);
    });

    it("should handle jsonata, datetime aritmethic, from msg / flow.", function (done) {
        this.timeout(850);
        var flow = convertLinkOut(deepCopy(testFlows.flow_taa1));
        helper.load(setDefaultsNodeClass, flow, function () {
            var testedNode = helper.getNode("92bb3b90.8c4638");
            var sink1 = helper.getNode("a19f4517.9aafc8");
            sink1.on("input", function (msg) {
                try {
                    // @formatter:off
                    var expectedMsg = {"dt":1534358582000,"minus":{"one_hour":1534354982000,"approx_one_day":1534266662000},"tomorrow":1534444982000,"humanFriendly":{"minus":{"one_hour":"2018-08-15T17:43:02.000Z","approx_one_day":"2018-08-14T17:11:02.000Z"},"tomorrow":"2018-08-16T18:43:02.000Z","dt":"2018-08-15T18:43:02.000Z"}};
                    // @formatter:on
                    dropMsgId(msg);
                    JSON.stringify(expectedMsg, Object.keys(expectedMsg).sort()).should.equal(JSON.stringify(msg, Object.keys(msg).sort()));
                    var c = {g: sink1.context().global, f: sink1.context().flow};
                    c.f.get("minus").one_hour.should.equal(1534354982000);
                    c.f.get("minus").approx_one_day.should.equal(1534266662000);
                    var hf = c.g.get("humanFriendly");
                    hf.minus.one_hour.should.equal("2018-08-15T17:43:02.000Z");
                    hf.minus.approx_one_day.should.equal("2018-08-14T17:11:02.000Z");
                    hf.tomorrow.should.equal("2018-08-16T18:43:02.000Z");
                    hf.dt.should.equal("2018-08-15T18:43:02.000Z");
                    done();
                }
                catch (e) {
                    console.log("Error", e.stack);
                    console.log("Error", e.name);
                    console.log("Error", e.message);
                }
            });
            testedNode.receive({});
        });
    });

    it("should write existing items to msg when configured so. taa2", function (done) {
        this.timeout(850);
        var flow = deepCopy(testFlows.flow2_nr3);
        flow.find(x => x.name === "t23").howSend.type = "full";
        flow.find(x => x.name === "t23").dropdownObjOrVal = "keyValue";
        flow.find(x => x.name === "t23").chbox_SetCurrentToMsg = "true";
        // Configure another rule to set xfirst.advanced which is impossible since value of this is now an object.
        flow.find(x => x.name === "t23").rules.push({"p": "xfirst.advanced", "pt": "flow", "to": "better_terminated", "tot": "str"});
        flow.find(x => x.name === "t23").wires.push(flow.find(x => x.name === "t23").wires[0]);
        var expecteds = [
            {"payload": "simple", first: "v2"},
            {"payload": "simple", first: "v2"}, // Value has already been set. Setting to other has no effect. MSG is set to whatever the real value is (not attempted default)
            {"payload": "simple"}, // We are setting first.advanced. First is currently not an object, so first.advanced cannot exist. Therfore, we change notning.
            {"payload": "simple", first: {advanced: "v5"}},
            {"payload": "simple", tree: {first: {v1: "v6"}}},
            {"payload": "simple", tree: {first: {v2: "v7"}}},
            {"payload": "simple", tree: {second: "v8"}},
            {"payload": "simple", xfirst: {advanced: {anotherobj: {payload1: "terminated"}}}},
            // our logic takes xfirst.advanced and writes it to msg as xfirst.advanced. Written is the object. Therfore, the line below equals to the line above. This should change if I write value only.
            {"payload": "simple", xfirst: {advanced: {anotherobj: {payload1: "terminated"}}}}
        ];
        multiOutputTest(flow, expecteds, [
            // @formatter:off
            function (node) {node.context().global.get("first").advanced.should.equal("v5")},
            function (node) {node.context().flow.get("first").should.equal("v2")},
            function (node) { node.context().flow.get("xfirst").advanced.anotherobj.payload1.should.equal("terminated")},
            function (node) {JSON.stringify(node.context().flow.get("tree")).should.equal(JSON.stringify({first: {v1: "v6", v2: "v7"}, second: "v8"}))}
            // @formatter:on
        ], commonMsgTestSimple(), done);
    });

    it("should write existing items to msg (value only), when configured so. taa3", function (done) {
        this.timeout(850);
        var flow = deepCopy(testFlows.flow2_nr3);
        flow.find(x => x.name === "t23").howSend.type = "full";
        flow.find(x => x.name === "t23").chbox_SetCurrentToMsg = "true";
        let hs = flow.find(x => x.name === "t23").howSend;
        hs.text = "current_value";
        hs.type = "msg";
        // Configure another rule to set xfirst.advanced which is impossible since value of this is now an object.
        flow.find(x => x.name === "t23").rules.push({"p": "xfirst.advanced", "pt": "flow", "to": "better_terminated", "tot": "str"});
        flow.find(x => x.name === "t23").wires.push(flow.find(x => x.name === "t23").wires[0]);
        var expecteds = [
            {"payload": "simple", current_value: "v2"},
            {"payload": "simple", current_value: "v2"},
            {"payload": "simple"},
            {"payload": "simple", current_value: "v5"},
            {"payload": "simple", current_value: "v6"},
            {"payload": "simple", current_value: "v7"},
            {"payload": "simple", current_value: "v8"},
            {"payload": "simple", current_value: "terminated"},
            {"payload": "simple", current_value: {anotherobj: {payload1: "terminated"}}}
        ];
        multiOutputTest(flow, expecteds, [
            // @formatter:off
            function (node) {node.context().global.get("first").advanced.should.equal("v5")},
            function (node) {node.context().flow.get("first").should.equal("v2")},
            function (node) { node.context().flow.get("xfirst").advanced.anotherobj.payload1.should.equal("terminated")},
            function (node) {JSON.stringify(node.context().flow.get("tree")).should.equal(JSON.stringify({first: {v1: "v6", v2: "v7"}, second: "v8"}))}
            // @formatter:on
        ], commonMsgTestSimple(), done);
    });

    // Similiar as above, write directly to message
    it("should write existing items to msg directly, when configured so. taa4", function (done) {
        this.timeout(850);
        var flow = deepCopy(testFlows.flow2_nr3);
        flow.find(x => x.name === "t23").howSend.type = "full";
        flow.find(x => x.name === "t23").chbox_SetCurrentToMsg = "true";
        // Configure another rule to set xfirst.advanced which is impossible since value of this is now an object.
        flow.find(x => x.name === "t23").rules.push({"p": "xfirst.advanced", "pt": "flow", "to": "better_terminated", "tot": "str"});
        flow.find(x => x.name === "t23").wires.push(flow.find(x => x.name === "t23").wires[0]);
        var expecteds = [
            {"payload": "v2"},
            {"payload": "v2"},
            {"payload": "simple"}, // Item we're reading is undefined - msg unchanged. "simple" not rewritten.
            {"payload": "v5"},
            {"payload": "v6"},
            {"payload": "v7"},
            {"payload": "v8"},
            {"payload": "terminated"},
            {"payload": {anotherobj: {payload1: "terminated"}}}
        ];
        multiOutputTest(flow, expecteds, [
            // @formatter:off
            function (node) {node.context().global.get("first").advanced.should.equal("v5")},
            function (node) {node.context().flow.get("first").should.equal("v2")},
            function (node) { node.context().flow.get("xfirst").advanced.anotherobj.payload1.should.equal("terminated")},
            function (node) {JSON.stringify(node.context().flow.get("tree")).should.equal(JSON.stringify({first: {v1: "v6", v2: "v7"}, second: "v8"}))}
            // @formatter:on
        ], commonMsgTestSimple(), done);
    });

    it("should remove values as configured", function (done) {
        this.timeout(850);
        var flow = convertLinkOut(testFlows.flow_taa5);
        helper.load(setDefaultsNodeClass, flow, function () {
            var testedNode = helper.getNode("cb454a99.cdd878");
            var sink1 = helper.getNode("a19f4517.9aafc8");
            var sink2 = helper.getNode("5b74b409.864fac");
            let counter = 2;
            var finishTest = function () {
                --counter;
                if (counter === 0) {
                    // test all flow variables
                    sink2.context().flow.get("simpleStays").should.equal('v2');
                    var deep = sink2.context().flow.get("deep");
                    JSON.stringify(deep).should.equal(JSON.stringify({"wontDelete": "v4", "deeper": {"second": "v9"}}));
                    should.not.exist(sink2.context().flow.get("simple1"));
                    should.not.exist(deep.deletingObj);
                    done();
                }
            };
            sink1.on("input", function (msg) {
                try {
                    // Deleting flow values does not change message. Make sure it is intact, as set in first set default node.
                    dropMsgId(msg);
                    const comparator = {simple1: 'v1', simpleStays: 'v2', deep: {willDelete: 'v3', wontDelete: 'v4', deletingObj: {v1: 'v5', v2: 'v6', v3: 'v7'}, deeper: {first_del: 'v8', second: 'v9'}}};
                    JSON.stringify(msg).should.equal(JSON.stringify(comparator));
                    // intermediate test of flow just to be sure
                    sink1.context().flow.get("deep").wontDelete.should.equal("v4");
                    finishTest();
                }
                catch
                    (e) {
                    console.log("Error", e.message, "\n", e.stack);
                }
            });
            sink2.on("input", function (msg) {
                    try {
                        dropMsgId(msg);
                        // We deleted some items from msg, check if it is correct.
                        const comparator = {simple1: 'v1', deep: {willDelete: 'v3', deletingObj: {v1: 'v5', v2: 'v6', v3: 'v7'}}};
                        JSON.stringify(msg).should.equal(JSON.stringify(comparator));
                        finishTest();
                    }
                    catch (e) {
                        console.log("Error", e.message, "\n", e.stack);
                    }
                }
            );
            // sink.context().flow.set("second", "finalflow");
            testedNode.receive({});
        });
    });
    it("should correctly read msg/flow/global and set elsewhere", function (done) {
        // example: set msg.something to flow.somethingElse .. and similiar.
        this.timeout(850);
        var flow = convertLinkOut(testFlows.flow_taa6);
        let expecteds = [{"q1": "s1", "final": "s1", "ways": "s1", "ways1": "s1"}];
        multiOutputTest(flow, expecteds, [
            // @formatter:off
            function (node) {node.context().flow.get("ways").should.equal("s1");},
            function (node) {node.context().flow.get("ways1").should.equal("s1");},
            function (node) {node.context().flow.get("final").should.equal("s1");},
            function (node) {should.not.exist(node.context().flow.get("globs"));},
            function (node) {should.not.exist(node.context().flow.get("q1"));},
            function (node) {node.context().global.get("globs").should.equal("s1");},
            function (node) {should.not.exist(node.context().global.get("ways"));},
            function (node) {should.not.exist(node.context().global.get("q1"));}
            // @formatter:on
        ], {}, done, "msg/flow/global", "938368ea.086b88");
    });
});
