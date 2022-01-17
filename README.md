# Repository Status

Repository status is a gnome extension and the goal of it is to provide a very simple overview of git repositories. 
Currently only shows the amount of pull requests requiring approval. 
In the long term, the objective is to improve it by adding new functionalities, like support for multiple repositories (currently only focused on bitbucket). 

# Installation

For now, place the code on **~/.local/share/gnome-shell/extensions/repo-status@kzd.homebrew.net**

# Development

### Pending issues/Further improvements [Version 1]

- Configuration settings are not checked nor sanitized before usage
- Configuration settings needs to be redesigned
- API endpoints should be enum based
- API call error handling needs specific errors (e.g.: authorization - a, etc.)
