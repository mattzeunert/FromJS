# Pushes gh-pages folder to gh-pages branch
# Before doing that it includes the generated code in gh-pages in the repo by editing .gitignore
# After the edit the .gitignore changes are reverted.

STATUS="$(git status)"

if [[ $STATUS == *"working tree clean"* ]]
then
    sed -i "" '/gh-pages/d' ./.gitignore
    git add .
    git commit -m "Edit .gitignore to publish"
    git push origin `git subtree split --prefix gh-pages v2`:gh-pages --force
    git reset HEAD~
    git checkout .gitignore
else
    echo "Need clean working directory to publish"
fi
