const container = document.getElementById("bubble-container")

const UNPOPPED = "resources/bubble.png"
const POPPED = [
    "resources/img/bubble_popped_1.png",
    "resources/img/bubble_popped_2.png",
    "resources/img/bubble_popped_3.png",
    "resources/img/bubble_popped_4.png",
    "resources/img/bubble_popped_5.png",
    "resources/img/bubble_popped_6.png",
    "resources/img/bubble_popped_7.png",
]

// Preload multiple audio objects for better performance
const soundPoolSize = 5
const popSounds = Array.from({ length: soundPoolSize }, () => {
    const audio = new Audio("resources/pop/pop_ (0).mp3")
    audio.preload = "auto"
    return audio
})
let soundIndex = 0

// Minimum percentage of bubbles that should remain unpopped
const MIN_UNPOPPED_PERCENTAGE = 0.15 // 15% of total bubbles
let totalBubbles = 0
let isResetting = false // flag to check if bubbles are being resetted

function getRandomPoppedImage() {
    const index = Math.floor(Math.random() * POPPED.length)
    return POPPED[index]
}

function playPopSound() {
    try {
        const sound = popSounds[soundIndex]
        sound.currentTime = 0
        sound.play().catch((e) => console.warn("Audio play failed:", e))
        soundIndex = (soundIndex + 1) % soundPoolSize
    } catch (error) {
        console.warn("Audio error:", error)
    }
}

function getBubbleSize() {
    return Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--bubble-size"))
}

function getBubbleGap() {
    return Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue("--bubble-gap"))
}

function calculateLayout() {
    const bubbleSize = getBubbleSize()
    const gap = getBubbleGap()
    const totalSpace = bubbleSize + gap
    
    const columns = Math.floor(window.innerWidth / totalSpace)
    const rows = Math.floor(window.innerHeight / totalSpace)
    
    return { columns, rows, bubbleSize, gap }
}

function countUnpoppedBubbles() {
    const bubbles = container.querySelectorAll(".bubble")
    return Array.from(bubbles).filter((bubble) => bubble.dataset.popped === "false").length
}

function getPoppedBubbles() {
    const bubbles = container.querySelectorAll(".bubble")
    return Array.from(bubbles).filter((bubble) => bubble.dataset.popped === "true")
}

function resetRandomBubbles(count) {
    const poppedBubbles = getPoppedBubbles()
    
    if (poppedBubbles.length === 0) return
    
    // Shuffle the popped bubbles array
    const shuffled = poppedBubbles.sort(() => Math.random() - 0.5)
    
    // Reset the specified number of bubbles (or all available if less than requested)
    const bubblestoReset = Math.min(count, shuffled.length)
    
    for (let i = 0; i < bubblestoReset; i++) {
        const bubble = shuffled[i]
        
        // Add a brief animation class
        bubble.style.transition = "transform 0.3s ease, opacity 0.3s ease"
        bubble.style.transform = "scale(1.2)"
        bubble.style.opacity = "0.7"
        
        setTimeout(() => {
            bubble.src = UNPOPPED
            bubble.dataset.popped = "false"
            bubble.classList.remove("popped")
            
            // Reset styles
            bubble.style.transform = "scale(1)"
            bubble.style.opacity = "1"
            
            // Remove inline styles after animation
            setTimeout(() => {
                bubble.style.transition = ""
                bubble.style.transform = ""
                bubble.style.opacity = ""
            }, 300)
        }, 150)
    }
}

function checkAndMaintainBubbles() {
    // Prevent multiple simultaneous resets
    if (isResetting) return
    
    const unpoppedCount = countUnpoppedBubbles()
    const minRequired = Math.max(Math.ceil(totalBubbles * MIN_UNPOPPED_PERCENTAGE), 1)
    
    if (unpoppedCount < minRequired) {
        isResetting = true
        const bubblesNeeded = minRequired - unpoppedCount
        resetRandomBubbles(bubblesNeeded + MIN_UNPOPPED_PERCENTAGE * totalBubbles)
        
        // Reset the flag after animation completes
        setTimeout(() => {
            isResetting = false
        }, 600)
    }
}

function generateBubbles() {
    container.innerHTML = "" // Clear existing bubbles
    
    const { columns, rows } = calculateLayout()
    
    for (let r = 0; r < rows; r++) {
        const rowDiv = document.createElement("div")
        rowDiv.className = "row"
        
        // Offset every other row for honeycomb pattern
        if (r % 2 === 1) {
            rowDiv.classList.add("offset")
        }
        
        // Reduce columns in offset rows to maintain alignment
        const columnsInRow = r % 2 === 1 ? Math.max(1, columns - 1) : columns
        
        for (let c = 0; c < columnsInRow; c++) {
            const img = document.createElement("img")
            img.src = UNPOPPED
            img.className = "bubble"
            img.dataset.popped = "false"
            
            // Add error handling for image loading
            img.onerror = () => {
                console.warn("Failed to load bubble image:", img.src)
            }
            
            img.addEventListener("click", () => {
                if (img.dataset.popped === "false") {
                    img.src = getRandomPoppedImage()
                    playPopSound()
                    
                    img.dataset.popped = "true"
                    img.classList.add("popped")
                    // Check the bubble count
                    checkAndMaintainBubbles()
                }
            })
            
            rowDiv.appendChild(img)
        }
        
        container.appendChild(rowDiv)
    }
    
    // Update total bubble count
    totalBubbles = container.querySelectorAll(".bubble").length
}



// Initialize the game
generateBubbles()

// Handle window resize with debouncing
let resizeTimeout
window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(generateBubbles, 150)
})

// Preload images for better performance
function preloadImages() {
    const imagesToPreload = [UNPOPPED, ...POPPED]
    imagesToPreload.forEach((src) => {
        const img = new Image()
        img.src = src
    })
}

// Start preloading when page loads
window.addEventListener("load", preloadImages)
