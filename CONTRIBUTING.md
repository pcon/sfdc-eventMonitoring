# How to Contribute

This has been developed by just one person, but may hands make light work.  Any help that you want to give would be greatly appreciated.

I can typically be found as "pcon" on IRC (#salesforce on freenode) if you need any realtime help.

##Quick Contributions
A contribution is more than just writing code.  You can help contribute to the project by doing any of the following:
*   Writing documentation (wiki or README.md)
*   Filing new [feature requests](https://github.com/pcon/sfdc-eventMonitoring/issues/new?template=feature_request.md)
*   Filing [bugs](https://github.com/pcon/sfdc-eventMonitoring/issues/new?template=bug_report.md)

## Submitting Changes
Please send a [pull request](https://github.com/pcon/sfdc-eventMonitoring/pull/new/master) with a clear list of what has been done (read more about [pull requests](http://help.github.com/pull-requests/)). Please follow our coding conventions (below) and make sure all of your commits are atomic (one feature per commit).

Prior to committing please run the lint check to ensure that your submission meets our coding conventions

```bash
npm run lint
```

## Coding Conventions

*   We indent using four spaces (soft tabs)
*   We ALWAYS put spaces after list items and method parameters (\[1, 2, 3\], not \[1,2,3\]), around operators (x += 1, not x+=1), and around hash arrows.