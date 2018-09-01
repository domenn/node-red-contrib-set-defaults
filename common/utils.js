var exported = {

    defaultSetter: function (obj, key, value) {
        obj[key] = value;
    },

    defaultGetter: function (obj, key) {
        return obj[key];
    },

    /**
     * Tries to get deep value, for example msg.something.somehtingelse.none.value. Does not do any validity checks or existance checks,
     * that's why dummy in name.
     * @param obj object to get value from
     * @param key example something or something.somethingelse
     * @param getter getter to use, flow and global context have different getter logic than msg for example. Only used top level.
     * @returns the value.
     */
    dummyGetDeep: function(obj, key, getter = exported.defaultGetter){
        let keyParts = key.split('.');
        // Use custom getter only the first time
        let myIterator = getter(obj, keyParts[0]);
        for (var i = 1; i< keyParts.length; ++i) {
            myIterator = myIterator[keyParts[i]];
        }
        return myIterator;
    },

    dummyDeleteDeep: function(obj, key, getter = exported.defaultGetter, setter=exported.defaultSetter){
        let keyParts = key.split('.');
        let myIterator = obj;
        do{
            if (keyParts.length === 1){
                setter(myIterator, keyParts[0], undefined);
                return;
            }
            myIterator = getter(myIterator, keyParts[0]);
            keyParts.splice(0,1);
            // custom getter and setter are only for top level stage.
            getter = exported.defaultGetter;
            setter=exported.defaultSetter
        }while(keyParts.length > 0);
        return myIterator;
    },

    /**
     * Sets value, possibly multilevel. Only if not already set. Returns object, whether modified or not.
     * Working with null is not supported and may sometimes overwrite it and some times not.
     * @param existingObject existing object or undefined for none. Passed item must be object.
     * @param key what to set.
     * @param value Value to set.
     * @param overwrite true to overwrite existing value, false to not do it.
     * @param customSetter Custom setter function to use instead of obj[key] = value
     * @param customGetter Custom getter function to use.
     */
    hierarchicSet: function (key, value, existingObject, overwrite=false, customSetter = exported.defaultSetter, customGetter = exported.defaultGetter, ) {
        if (typeof existingObject === 'undefined' || existingObject === null) {
            existingObject = {};
        }
        if (typeof value === 'undefined') {
            return {modified: false, obj: existingObject};
        }
        let keyParts;
        if (typeof key === "string") {
            keyParts = key.split('.');
        } else {
            keyParts = key;
        }
        var modified = false;

        var existingValue = customGetter(existingObject, keyParts[0]);

        if (existingValue == null || overwrite || typeof existingValue === "object") {
            // We have null .. write the thing.
            if (keyParts.length === 1) {
                // Option 1: We are at the end of chain .. set the value
                if (typeof existingValue !== "object" || overwrite) {
                    customSetter(existingObject, keyParts[0], value);
                    modified = true;
                }
            } else {
                if(overwrite){
                    if (typeof existingValue !== "object"){
                        customSetter(existingObject, keyParts[0], {});
                    }
                }
                // Option 2: we must make an object and assign to key.
                var recursed = exported.hierarchicSet(keyParts.slice(1), value, customGetter(existingObject, keyParts[0]), overwrite);
                customSetter(existingObject, keyParts[0], recursed.obj);
                modified = recursed.modified;
            }
        }
        //else if (typeof existingObject )

        return {modified: modified, obj: existingObject};
    }
};

module.exports = exported;