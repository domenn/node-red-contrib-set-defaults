
var should = require("should");

var commonImport = require("../common/utils");
var setHierarchicalNoOverwrite = commonImport.hierarchicSet;

describe('Common methods tests', function () {

    // it('testJsNullChecks', function (done) {
    //     var undef = undefined;
    //     var _n = null;
    //     var _f = false;
    //     var _t = true;
    //     var _0 = 0;
    //     var _neg1= -1;
    //     var _1 = 1;
    //     var _true = "true";
    //     var _false = "false";
    // });

    it('should set value if not already set, recursively', function (done) {
        var msg = {};
        var return1 = setHierarchicalNoOverwrite("what", "value", msg).obj;
        msg = setHierarchicalNoOverwrite("what", "value").obj;
        setHierarchicalNoOverwrite("what.what1", "value_1", msg);
        // what shouldn't have changed
        msg.should.have.property("what", "value");
        // Simple hierarhcical setting
        setHierarchicalNoOverwrite("testitem.simple", 42, msg);
        msg.should.have.property("testitem");
        setSuccess = setHierarchicalNoOverwrite("testitem.advanced", -811, msg);
        setSuccess.should.have.property("modified", true);
        msg.testitem.should.have.property("simple", 42);
        msg.testitem.should.have.property("advanced", -811);
        // More complicated hierarchical test
        should.equal(setHierarchicalNoOverwrite("newitem.sub.great", "value1", msg).modified, true);
        msg.should.have.property("newitem");
        msg.newitem.should.have.property("sub");
        msg.newitem.sub.should.have.property("great", "value1");
        // Now test setting those that have already object and need modifies .. make sure it doesn't get rewritten
        should.equal(setHierarchicalNoOverwrite("newitem.sub.v2", "value2", msg).modified, true);
        msg.newitem.sub.should.have.property("v2", "value2");
        msg.newitem.sub.should.have.property("great", "value1");
        // Make sure we cannot change it.
        should.equal(setHierarchicalNoOverwrite("newitem.sub.v2", "value3", msg).modified, false);
        msg.newitem.sub.should.have.property("v2", "value2");

        // Repeat assertions to assure the calls didn't delete properties
        msg.should.have.property("what", "value");
        msg.newitem.sub.should.have.property("great", "value1");

        // what about if we set null to it?
        should.equal(setHierarchicalNoOverwrite("testitem._null", null, msg).modified, true);
        should.equal(msg.testitem._null, null);
        done();
    });

    it('should not promote string to object, or the other way around', function (done) {
        var r = setHierarchicalNoOverwrite("what.what1", "value");
        var msg = r.obj;
        r.modified.should.equal(true);
        should.equal(setHierarchicalNoOverwrite("what.what2", "value2", msg).modified, true);
        JSON.stringify(msg).should.equal(JSON.stringify({what: {what1:"value", what2:"value2"}}));
        // what2 is string. Therfore, if we try to set what2.something it should NOT be possible.
        should.equal(setHierarchicalNoOverwrite("what.what2.further", "value21", msg).modified, false);
        JSON.stringify(msg).should.equal(JSON.stringify({what: {what1:"value", what2:"value2"}}));
        should.equal(setHierarchicalNoOverwrite("what", "impossible", msg).modified, false);
        // msg.what is object, so it cannot be set to string
        JSON.stringify(msg).should.equal(JSON.stringify({what: {what1:"value", what2:"value2"}}));
        done();
    });

    it('should set subitems to existing subobjects and report status', function (done) {
        var msg = {thingy:{v1:"x1", v2:"x2", v3:{v21:"xx1", v32:"xx2"}}};
        var unchanged1 = setHierarchicalNoOverwrite("thingy.v1", "x__1", msg);
        var unchanged2 = setHierarchicalNoOverwrite("thingy.v3.v21", "val", msg);
        var changed = setHierarchicalNoOverwrite("thingy.v3.v22", "val", msg);
        JSON.stringify(msg).should.equal(JSON.stringify({thingy:{v1:"x1", v2:"x2", v3:{v21:"xx1", v32:"xx2", v22:"val"}}}));
        unchanged1.should.have.property("modified", false);
        unchanged2.should.have.property("modified", false);
        changed.should.have.property("modified", true);
        done();
    });

    it('should handle false values correctly. Should set return value correctly.', function (done) {
        var msg = {what:false};
        var changes1 = setHierarchicalNoOverwrite("what", true, msg);
        msg.should.have.property("what", false);
        changes1.should.have.property("modified", false);
        var msg1 = {what:0};
        var changes2 = setHierarchicalNoOverwrite("what", true, msg1);
        changes2.should.have.property("modified", false);
        msg1.should.have.property("what", 0);
        // Null is supposed to get overwritten, but that is not implemented right now. So null is valid value that will not be overwritten.
        // var msg2 = {what:null};
        // setHierarchicalNoOverwrite("what", true, msg2);
        // msg2.should.have.property("what", true);
        done();
    });
});