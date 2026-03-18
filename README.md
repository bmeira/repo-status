# Repository Status
Repository Status is a simple gnome extension to provide a very simple overview of git repositories. 
Currently only shows selected notifications on github repositories. Other functionalities, like support for multiple repositories, might be added later on. 

# Installation
For now, place the code on **~/.local/share/gnome-shell/extensions/repo-status@kzd.homebrew.net**


# Acknowledgments
[gnome-github-notifications](https://github.com/alexduf/gnome-github-notifications) → solid base to start from

# Debugging / logging
use `journalctl /usr/bin/gnome-shell -f | grep "repo-status"` to follow the extension logs 
(check Logger.js for more details)