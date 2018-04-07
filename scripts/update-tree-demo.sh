mkdir gh-pages/tree-demo
cp packages/ui/index.html gh-pages/tree-demo/index.html
echo "---\nlayout: default\ntitle: Understand JavaScript Apps\n---\n$(cat gh-pages/tree-demo/index.html)" > gh-pages/tree-demo/index.html
cp packages/ui/Treant.css gh-pages/tree-demo/Treant.css
cp -r packages/ui/codemirror gh-pages/tree-demo/codemirror
cp packages/ui/raphael.js gh-pages/tree-demo/raphael.js
cp packages/ui/Treant.js gh-pages/tree-demo/Treant.js
mkdir gh-pages/tree-demo/dist
cp packages/ui/dist/bundle.js gh-pages/tree-demo/dist/bundle.js
echo "done"