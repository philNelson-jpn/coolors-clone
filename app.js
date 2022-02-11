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

// Local storage
let savedPalettes = []


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

// Implement Save to palette and LOCAL STORAGE STUFF

// const saveBtn = document.querySelector(".save")
// const submitSave = document.querySelector(".submit-save")
// const closeSave = document.querySelector(".close-save")
// const saveContainer = document.querySelector(".save-container")
// const saveInput = document.querySelector(".save-container input")
// const libraryContainer = document.querySelector(".library-container")
// const libraryBtn = document.querySelector(".library")
// const closeLibraryBtn = document.querySelector(".close-library")

// // Event listeners
// saveBtn.addEventListener("click", openPalette)
// closeSave.addEventListener("click", closePalette)
// submitSave.addEventListener("click", savePalette)
// libraryBtn.addEventListener("click", openLibrary)
// closeLibraryBtn.addEventListener("click", closeLibrary)


// // Functions

// function openPalette(e) {
//     const popup = saveContainer.children[0]
//     saveContainer.classList.add("active")
//     popup.classList.add("active")
// }

// function closePalette(e) {
//     const popup = saveContainer.children[0]
//     saveContainer.classList.remove("active")
//     popup.classList.add("remove")
// }

// function savePalette(e) {
//     saveContainer.classList.remove("active")
//     popup.classList.remove("active")
//     const name = saveInput.value
//     const colors = []
//     currentHexes.forEach(hex => {
//         colors.push(hex.innerText)
//     })


//     // Generate Object
//     let paletteNr
//     const paletteObjects = JSON.parse(localStorage.getItem("palettes"))
//     if (paletteObjects) {
//         paletteNr = paletteObjects.length
//     } else {
//         paletteNr = savedPalettes.length
//     }
//     // create a new array with an object of our saved colors
//     const paletteObj = { name, colors, nr: paletteNr }
//     savedPalettes.push(paletteObj)
//     // Save to localStorage
//     savetoLocal(paletteObj)
//     saveInput.value = ""
//     // Generate the palette for Library
//     const palette = document.createElement("div")
//     palette.classList.add("custom-palette")
//     const title = document.createElement("h4")
//     title.innerText = paletteObj.name
//     const preview = document.createElement("div")
//     preview.classList.add("small-preview")
//     paletteObj.colors.forEach(smallColor => {
//         const smallDiv = document.createElement("div")
//         smallDiv.style.backgroundColor = smallColor
//         preview.appendChild(smallDiv)
//     })
//     const paletteBtn = document.createElement("button")
//     paletteBtn.classList.add("pick-palette-btn")
//     paletteBtn.classList.add(paletteObj.nr)
//     paletteBtn.innerText = "Select"

//     // Attach event to the button
//     paletteBtn.addEventListener("click", e => {
//         closeLibrary()
//         // We keep pushing in new buttons to select saved palettes, so we can grab the colors
//         const paletteIndex = e.target.classList[1]
//         initialColors = []
//         // Access the colors in our library and set it to the background when we click select
//         savedPalettes[paletteIndex].colors.forEach((color, index) => {
//             initialColors.push(color)
//             colorDivs[index].style.backgroundColor = color
//             const text = colorDivs[index].children[0]
//             // Update the text and icons to have contrast
//             checkTextContrast(color, text)
//             // update the hex text to reflect the correct color
//             updateTextUI(index)
//         })
//         // update the sliders to reflect the correct color
//         resetInputs()

//     })

//     // Append to Library
//     palette.appendChild(title)
//     palette.appendChild(preview)
//     palette.appendChild(paletteBtn)
//     libraryContainer.children[0].appendChild(palette)
// }

// function savetoLocal(paletteObj) {
//     let localPalettes
//     // Check if we have a palette in our local storage, if we don't add an empty array
//     if (localStorage.getItem("palettes") === null) {
//         localPalettes = []

//     } else {
//         localPalettes = JSON.parse(localStorage.getItem("palettes"))
//     }
//     // if we do then we push something to local storage
//     localPalettes.push(paletteObj)
//     localStorage.setItem("palettes", JSON.stringify(localPalettes))
// }

// function openLibrary() {
//     const popup = libraryContainer.children[0]
//     libraryContainer.classList.add("active")
//     popup.classList.add("active")
// }
// function closeLibrary() {
//     const popup = libraryContainer.children[0]
//     libraryContainer.classList.remove("active")
//     popup.classList.remove("active")
// }

// function getLocal() {
//     if (localStorage.getItem("palette") === null) {
//         localPalettes = []
//     } else {
//         const paletteObjects = JSON.parse(localStorage.getItem("palettes"))

//         savedPalettes = [...paletteObjects]
//         paletteObjects.forEach(paletteObj => {
//             // Generate the palette for Library
//             const palette = document.createElement("div")
//             palette.classList.add("custom-palette")
//             const title = document.createElement("h4")
//             title.innerText = paletteObj.name
//             const preview = document.createElement("div")
//             preview.classList.add("small-preview")
//             paletteObj.colors.forEach(smallColor => {
//                 const smallDiv = document.createElement("div")
//                 smallDiv.style.backgroundColor = smallColor
//                 preview.appendChild(smallDiv)
//             })
//             const paletteBtn = document.createElement("button")
//             paletteBtn.classList.add("pick-palette-btn")
//             paletteBtn.classList.add(paletteObj.nr)
//             paletteBtn.innerText = "Select"

//             // Attach event to the button
//             paletteBtn.addEventListener("click", e => {
//                 closeLibrary()
//                 // We keep pushing in new buttons to select saved palettes, so we can grab the colors
//                 const paletteIndex = e.target.classList[1]
//                 initialColors = []
//                 // Access the colors in our library and set it to the background when we click select
//                 paletteObjects[paletteIndex].colors.forEach((color, index) => {
//                     initialColors.push(color)
//                     colorDivs[index].style.backgroundColor = color
//                     const text = colorDivs[index].children[0]
//                     // Update the text and icons to have contrast
//                     checkTextContrast(color, text)
//                     // update the hex text to reflect the correct color
//                     updateTextUI(index)
//                 })
//                 // update the sliders to reflect the correct color
//                 resetInputs()

//             })

//             // Append to Library
//             palette.appendChild(title)
//             palette.appendChild(preview)
//             palette.appendChild(paletteBtn)
//             libraryContainer.children[0].appendChild(palette)
//         })
//     }
// }

const saveBtn = document.querySelector(".save");
const submitSave = document.querySelector(".submit-save");
const closeSave = document.querySelector(".close-save");
const saveContainer = document.querySelector(".save-container");
const saveInput = document.querySelector(".save-container input");
const libraryContainer = document.querySelector(".library-container");
const libraryBtn = document.querySelector(".library");
const closeLibraryBtn = document.querySelector(".close-library");

//Event Listeners
saveBtn.addEventListener("click", openPalette);
closeSave.addEventListener("click", closePalette);
submitSave.addEventListener("click", savePalette);
libraryBtn.addEventListener("click", openLibrary);
closeLibraryBtn.addEventListener("click", closeLibrary);

function openPalette(e) {
    const popup = saveContainer.children[0];
    saveContainer.classList.add("active");
    popup.classList.add("active");
}
function closePalette(e) {
    const popup = saveContainer.children[0];
    saveContainer.classList.remove("active");
    popup.classList.add("remove");
}
function savePalette(e) {
    saveContainer.classList.remove("active");
    popup.classList.remove("active");
    const name = saveInput.value;
    const colors = [];
    currentHexes.forEach(hex => {
        colors.push(hex.innerText);
    });
    //Generate Object
    //*1
    // const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
    // let paletteNr;
    // if (paletteObjects) {
    //   paletteNr = paletteObjects.length;
    // } else {
    //   paletteNr = savedPalettes.length;
    // }

    let paletteNr;
    const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
    if (paletteObjects) {
        paletteNr = paletteObjects.length;
    } else {
        paletteNr = savedPalettes.length;
    }

    const paletteObj = { name, colors, nr: paletteNr };
    savedPalettes.push(paletteObj);
    //Save to localStorage
    savetoLocal(paletteObj);
    saveInput.value = "";
    //Generate the palette for Library
    const palette = document.createElement("div");
    palette.classList.add("custom-palette");
    const title = document.createElement("h4");
    title.innerText = paletteObj.name;
    const preview = document.createElement("div");
    preview.classList.add("small-preview");
    paletteObj.colors.forEach(smallColor => {
        const smallDiv = document.createElement("div");
        smallDiv.style.backgroundColor = smallColor;
        preview.appendChild(smallDiv);
    });
    const paletteBtn = document.createElement("button");
    paletteBtn.classList.add("pick-palette-btn");
    paletteBtn.classList.add(paletteObj.nr);
    paletteBtn.innerText = "Select";

    //Attach event to the btn
    paletteBtn.addEventListener("click", e => {
        closeLibrary();
        const paletteIndex = e.target.classList[1];
        initialColors = [];
        savedPalettes[paletteIndex].colors.forEach((color, index) => {
            initialColors.push(color);
            colorDivs[index].style.backgroundColor = color;
            const text = colorDivs[index].children[0];
            checkTextContrast(color, text);
            updateTextUI(index);
        });
        resetInputs();
    });

    //Append to Library
    palette.appendChild(title);
    palette.appendChild(preview);
    palette.appendChild(paletteBtn);
    libraryContainer.children[0].appendChild(palette);
}

function savetoLocal(paletteObj) {
    let localPalettes;
    if (localStorage.getItem("palettes") === null) {
        localPalettes = [];
    } else {
        localPalettes = JSON.parse(localStorage.getItem("palettes"));
    }
    localPalettes.push(paletteObj);
    localStorage.setItem("palettes", JSON.stringify(localPalettes));
}
function openLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.add("active");
    popup.classList.add("active");
}
function closeLibrary() {
    const popup = libraryContainer.children[0];
    libraryContainer.classList.remove("active");
    popup.classList.remove("active");
}

function getLocal() {
    if (localStorage.getItem("palettes") === null) {
        //Local Palettes
        localPalettes = [];
    } else {
        const paletteObjects = JSON.parse(localStorage.getItem("palettes"));
        // *2

        savedPalettes = [...paletteObjects];
        paletteObjects.forEach(paletteObj => {
            //Generate the palette for Library
            const palette = document.createElement("div");
            palette.classList.add("custom-palette");
            const title = document.createElement("h4");
            title.innerText = paletteObj.name;
            const preview = document.createElement("div");
            preview.classList.add("small-preview");
            paletteObj.colors.forEach(smallColor => {
                const smallDiv = document.createElement("div");
                smallDiv.style.backgroundColor = smallColor;
                preview.appendChild(smallDiv);
            });
            const paletteBtn = document.createElement("button");
            paletteBtn.classList.add("pick-palette-btn");
            paletteBtn.classList.add(paletteObj.nr);
            paletteBtn.innerText = "Select";

            //Attach event to the btn
            paletteBtn.addEventListener("click", e => {
                closeLibrary();
                const paletteIndex = e.target.classList[1];
                initialColors = [];
                paletteObjects[paletteIndex].colors.forEach((color, index) => {
                    initialColors.push(color);
                    colorDivs[index].style.backgroundColor = color;
                    const text = colorDivs[index].children[0];
                    checkTextContrast(color, text);
                    updateTextUI(index);
                });
                resetInputs();
            });

            //Append to Library
            palette.appendChild(title);
            palette.appendChild(preview);
            palette.appendChild(paletteBtn);
            libraryContainer.children[0].appendChild(palette);
        });
    }
}



getLocal()
randomColors()

