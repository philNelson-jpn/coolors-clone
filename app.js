// Global selections and variables

const colorDivs = document.querySelectorAll(".color")
const generateBtn = document.querySelector(".generate")
// select everything that has a type of 'range':
const sliders = document.querySelectorAll('input[type="range"]')
const currentHexes = document.querySelectorAll(".color h2")
const popup = document.querySelector(".copy-container")
const lockBtn = document.querySelectorAll(".lock")
const adjustBtn = document.querySelectorAll(".adjust")
const closeAdjustments = document.querySelectorAll(".close-adjustment")
const sliderContainers = document.querySelectorAll(".sliders")

let initialColors

// Event Listeners
generateBtn.addEventListener("click", randomColors)

sliders.forEach(slider => {
    slider.addEventListener("input", hslControls)
})

colorDivs.forEach((div, index) => {
    div.addEventListener("change", () => {
        updateTextUI(index)
    })
})

currentHexes.forEach(hex => {
    hex.addEventListener("click", () => {
        copyToClipboard(hex)
    })
})

// Remove "copied to clipboard modal on click"
popup.addEventListener("click", () => {
    const popupBox = popup.children[0]
    popup.classList.remove("active")
    popupBox.classList.remove("active")
})

adjustBtn.forEach((button, index) => {
    button.addEventListener("click", () => {
        openAdjustmentPanel(index)
    })
})

closeAdjustments.forEach((button, index) => {
    button.addEventListener("click", () => {
        closeAdjustmentPanel(index)
    })
})

lockBtn.forEach((button, index) => {
    button.addEventListener("click", e => {
        lockLayer(e, index)
    })
})



// Functions


// Color Generator

function generateHex() {
    const hexColor = chroma.random()
    return hexColor
}

function randomColors() {
    // initalColors need to be reset (emptied out) everytime randomColors runs
    initialColors = []
    colorDivs.forEach((div, index) => {
        const hexText = div.children[0] //the H2 element
        const randomColor = generateHex()
        // Add initial colors to the array
        if (div.classList.contains("locked")) {
            initialColors.push(hexText.innerText)
            return
        } else {
            initialColors.push(chroma(randomColor).hex())
        }
        initialColors.push(chroma(randomColor).hex())
        // gives us access to the original hex values



        // Add the color to the background
        div.style.backgroundColor = randomColor
        hexText.innerText = randomColor
        // Check for contrast with the randomly generated color
        checkTextContrast(randomColor, hexText)
        // Initialize color sliders
        const color = chroma(randomColor)
        const sliders = div.querySelectorAll(".sliders input")
        // Select the individual sliders for each color
        const hue = sliders[0]
        const brightness = sliders[1]
        const saturation = sliders[2]

        colorizeSliders(color, hue, brightness, saturation)
    })
    // Reset inputs
    resetInputs()

    // Check for button contrast
    adjustBtn.forEach((button, index) => {
        checkTextContrast(initialColors[index], button)
        checkTextContrast(initialColors[index], lockBtn[index])
    })
}

function checkTextContrast(color, text) {
    const luminance = chroma(color).luminance()
    // gives you a value of 0-1
    // We can use this to determine how the text should be displayed given the luminance of the background (to create contrast)
    if (luminance > 0.5) {
        text.style.color = "black"
    } else {
        text.style.color = "white"
    }
}

function colorizeSliders(color, hue, brightness, saturation) {
    // scale saturation with chroma.js set method
    const noSat = color.set("hsl.s", 0)//get the color and desaturate it as much as possible
    const fullSat = color.set("hsl.s", 1)//opposite of the above
    const scaleSat = chroma.scale([noSat, color, fullSat])

    // scale brightness
    const midBright = color.set("hsl.l", 0.5)
    const scaleBright = chroma.scale(["black", midBright, "white"])

    // Update Input Colors
    saturation.style.backgroundImage = `linear-gradient(to right, ${scaleSat(0)}, ${scaleSat(1)})`

    //For brightness we need three values or else we would just get white and black
    brightness.style.backgroundImage = `linear-gradient(to right, ${scaleBright(0)}, ${scaleBright(0.5)}, ${scaleBright(1)})`

    hue.style.backgroundImage = `linear-gradient(to right, rgb(204, 75, 75), rgb(204,204,75), rgb(75, 204, 75), rgb(75, 204, 204), rgb(75, 75, 204), rgb(204, 75, 204), rgb(204, 75, 75))`
}

function hslControls(e) {
    // get the index of the position of each of the sliders
    const index = e.target.getAttribute("data-bright") ||
        e.target.getAttribute("data-sat") ||
        e.target.getAttribute("data-hue")
    // grab the whole slider
    let sliders = e.target.parentElement.querySelectorAll('input[type="range"]')
    const hue = sliders[0]
    const brightness = sliders[1]
    const saturation = sliders[2]

    // Make text update with initial array values for the hex
    // Always uses this as a reference instead of updating the hex value to black or white.
    const bgColor = initialColors[index]

    // modify the color based on the input (of the slider)
    let color = chroma(bgColor)
        .set("hsl.s", saturation.value)
        .set("hsl.l", brightness.value)
        .set("hsl.h", hue.value)

    colorDivs[index].style.backgroundColor = color

    // Update the sliders to match the colors shown
    colorizeSliders(color, hue, brightness, saturation)
}

function updateTextUI(index) {
    // take the color from the background and update the hex text
    // However, we don't want to lose the reference to the original color because we are going to adjust it not completely change/replace it. This is where initialColors comes in
    const activeDiv = colorDivs[index]
    const color = chroma(activeDiv.style.backgroundColor)
    const textHex = activeDiv.querySelector("h2")
    const icons = activeDiv.querySelectorAll(".controls button")
    textHex.innerText = color.hex()
    // Change the contrast of the text and icons with our function
    checkTextContrast(color, textHex)
    for (icon of icons) {
        checkTextContrast(color, icon)
    }
}

function resetInputs() {
    // Everytime we refresh/generate the sliders will reflect the exact color displayed
    const sliders = document.querySelectorAll(".sliders input")
    sliders.forEach(slider => {
        if (slider.name === "hue") {
            // if the slider is a certain hue, then we want to change it
            const hueColor = initialColors[slider.getAttribute("data-hue")]
            // grab the hue value
            const hueValue = chroma(hueColor).hsl()[0]
            slider.value = Math.floor(hueValue)
        }
        if (slider.name === "brightness") {
            const brightColor = initialColors[slider.getAttribute("data-bright")]
            const brightValue = chroma(brightColor).hsl()[2]
            slider.value = Math.floor(brightValue * 100) / 100
        }
        if (slider.name === "saturation") {
            const satColor = initialColors[slider.getAttribute("data-sat")]
            const satValue = chroma(satColor).hsl()[1]
            slider.value = Math.floor(satValue * 100) / 100
        }
    })
}

// copy the hex colors by copying from a text area (click on the hex values and that copies them)
function copyToClipboard(hex) {
    const el = document.createElement("textarea")
    el.value = hex.innerText
    document.body.appendChild(el)
    el.select()
    document.execCommand("copy")
    document.body.removeChild(el)
    // pop-up animation "copied to clipboard modal"
    const popupBox = popup.children[0]
    popup.classList.add("active")
    popupBox.classList.add("active")
}

function openAdjustmentPanel(index) {
    sliderContainers[index].classList.toggle("active")
}

function closeAdjustmentPanel(index) {
    sliderContainers[index].classList.remove("active")
}

function lockLayer(e, index) {
    const lockSVG = e.target.children[0]
    const activeBG = colorDivs[index]
    activeBG.classList.toggle("locked")

    if (lockSVG.classList.contains("fa-lock-open")) {
        e.target.innerHTML = '<i class="fas fa-lock"></i>'
    } else {
        e.target.innerHTML = '<i class="fas fa-lock-open"></i>'
    }
}

randomColors()
