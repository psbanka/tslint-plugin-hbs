"use strict";
exports.__esModule = true;
var tslib_1 = require("tslib");
var ts = require("typescript");
var Lint = require("tslint");
var TemplateLinter = require('ember-template-lint');
var fs = require('fs');
var Rule = /** @class */ (function (_super) {
    tslib_1.__extends(Rule, _super);
    function Rule() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Rule.prototype.apply = function (sourceFile) {
        return this.applyWithWalker(new CheckHbsTemplateLiteralsWalker(sourceFile, this.getOptions()));
    };
    return Rule;
}(Lint.Rules.AbstractRule));
exports.Rule = Rule;
var CheckHbsTemplateLiteralsWalker = /** @class */ (function (_super) {
    tslib_1.__extends(CheckHbsTemplateLiteralsWalker, _super);
    function CheckHbsTemplateLiteralsWalker() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // it doesn't seem like there's a visitTaggedTemplateExpression() method,
    // so we'll look for TaggedTemplateExpressions ourselves
    CheckHbsTemplateLiteralsWalker.prototype.visitNode = function (node) {
        var options = this.getOptions();
        var configFile = options[0] && options[0].ConfigFile;
        var linter;
        if (configFile) {
            if (fs.existsSync(configFile)) {
                var config = JSON.parse(fs.readFileSync(configFile));
                linter = new TemplateLinter({ config: config });
            }
        }
        if (!linter) {
            linter = new TemplateLinter();
        }
        if (node.kind === ts.SyntaxKind.TaggedTemplateExpression) {
            var children = node.getChildren();
            var tag = children.filter(function (ch) { return ch.kind === ts.SyntaxKind.Identifier; })[0];
            if (tag.escapedText === 'hbs') {
                var results = linter.verify({ source: tag.parent.template.text });
                if (results.length !== 0) {
                    var firstLine = results[0].message.split('\n')[0];
                    var msg = results.length + " error(s): " + firstLine;
                    this.addFailure(this.createFailure(node.getStart(), node.getWidth(), msg));
                }
            }
            var tagIndex = children.indexOf(tag);
        }
        _super.prototype.visitNode.call(this, node);
    };
    return CheckHbsTemplateLiteralsWalker;
}(Lint.RuleWalker));
