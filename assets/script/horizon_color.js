var colors = {
    "red": "#ff1744",
    "pink": "#ff4081",
    "purple": "#8e24aa",
    "deeppurple": "#7c4dff",
    "indigo": "#536dfe",
    "blue": "#2979ff",
    "lightblue": "#40c4ff",
    "cyan": "#00e5ff",
    "teal": "#1de9b6",
    "green": "#00e676",
    "lightgreen": "#76ff03",
    "lime": "#c6ff00",
    "yellow": "#ffff00",
    "amber": "#ffb300",
    "orange": "#ff6d00",
    "deeporange": "#f4511e"
}

var keys = Object.keys(colors)
var colorName = keys[Math.floor(Math.random() * keys.length)]
var colorHex = colors[colorName]
document.getElementById("horizon-image").src = "/img/horizon_" + colorName + ".png"

var borderContainers = document.getElementsByClassName("horizon-recolor")
for (var i = 0; i < borderContainers.length; i++) {
    borderContainers[i].style.borderColor = colorHex
}