import * as ts from 'typescript'
import * as Lint from 'tslint'
const TemplateLinter = require('ember-template-lint')
const fs = require('fs')

export class Rule extends Lint.Rules.AbstractRule {
  public apply(sourceFile: ts.SourceFile): Lint.RuleFailure[] {
    return this.applyWithWalker(new CheckHbsTemplateLiteralsWalker(sourceFile, this.getOptions()))
  }
}

class CheckHbsTemplateLiteralsWalker extends Lint.RuleWalker {
  // it doesn't seem like there's a visitTaggedTemplateExpression() method,
  // so we'll look for TaggedTemplateExpressions ourselves
  protected visitNode(node: ts.Node): void {
    const options = this.getOptions()
    const configFile = options[0] && options[0].ConfigFile
    let linter
    if (configFile) {
      if (fs.existsSync(configFile)) {
        const config = JSON.parse(fs.readFileSync(configFile))
        linter = new TemplateLinter({ config })
      }
    }
    if (!linter) {
      linter = new TemplateLinter()
    }

    if (node.kind === ts.SyntaxKind.TaggedTemplateExpression) {
      const children = node.getChildren()
      const tag = children.filter(ch => ch.kind === ts.SyntaxKind.Identifier)[0] as any
      if (tag.escapedText === 'hbs') {
        const results = linter.verify({ source: tag.parent.template.text })
        if (results.length !== 0) {
          const firstLine = results[0].message.split('\n')[0]
          const msg = `${results.length} error(s): ${firstLine}`
          this.addFailure(this.createFailure(node.getStart(), node.getWidth(), msg))
        }
      }
      const tagIndex = children.indexOf(tag)
    }
    super.visitNode(node)
  }
}
