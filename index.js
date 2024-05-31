// Initialize the Fabric.js canvas
var canvas = new fabric.Canvas("c", {
  width: window.innerWidth,
  height: window.innerHeight,
});

// Adjust canvas size on window resize
window.addEventListener("resize", function () {
  canvas.setWidth(window.innerWidth);
  canvas.setHeight(window.innerHeight);
  canvas.renderAll();
});

// Load canvas state from localStorage if it exists
var savedState = localStorage.getItem("canvasState");
if (savedState) {
  canvas.loadFromJSON(savedState, canvas.renderAll.bind(canvas));
}

// Handle events for the textbox
canvas.on("mouse:dblclick", function (options) {
  if (options.target && options.target.type === "textbox") {
    options.target.enterEditing(); // Enter editing mode directly
    options.target.selectAll(); // Optional: Select all text to easily replace it
  }
});

canvas.on("text:editing:exited", function (options) {
  if (options.target && options.target.type === "textbox") {
    var originalText = options.target.originalText; // Assume originalText is stored when text editing starts

    // Check if text has been changed
    if (options.target.text !== originalText) {
      showModal(); // Show modal for username and password input only if text has changed

      document.getElementById("submitBtn").onclick = function () {
        var inputUsername = document.getElementById("username").value;
        var inputPassword = document.getElementById("password").value;

        // Check if the entered credentials match those stored in the textbox metadata
        if (
          inputUsername === options.target.metadata?.username &&
          inputPassword === options.target.metadata?.password
        ) {
          // Credentials are valid, allow text change to proceed
          closeModal(); // Close modal after operation
        } else {
          alert("Incorrect username or password!");

          // set the text back to the original value
          // console.log(options.target);
          // options.target.text = originalText;

          canvas.renderAll();
          closeModal(); // Close modal after operation
        }
      };
    }
  }
});

// Function to find a non-overlapping position
function findAvailablePosition(newObject) {
  let bestPosition = { left: 20, top: 20 };
  let maxDistance = 0;
  for (let x = 20; x < canvas.width - newObject.width; x += 50) {
    for (let y = 20; y < canvas.height - newObject.height; y += 50) {
      newObject.set({ left: x, top: y });
      let minDistance = Infinity;
      canvas.forEachObject(function (obj) {
        if (obj !== newObject) {
          let distance = Math.sqrt(
            Math.pow(obj.left - x, 2) + Math.pow(obj.top - y, 2)
          );
          if (distance < minDistance) {
            minDistance = distance;
          }
        }
      });
      if (minDistance > maxDistance) {
        maxDistance = minDistance;
        bestPosition = { left: x, top: y };
      }
    }
  }
  return bestPosition;
}

// Function to show the modal
function showModal() {
  document.getElementById("textboxModal").style.display = "block";
  document.getElementById("username").focus(); // Automatically focus on the username input
}

// Event listener for the button to add a new textbox
document
  .getElementById("addTextbox")
  .addEventListener("click", function (event) {
    showModal(); // Show the modal to fill details
    event.stopPropagation(); // Prevent the event from bubbling up to the window
  });

// Function to add a new textbox
function addTextbox() {
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Username and password must be filled out!");
    return; // Exit the function if credentials are not provided
  }

  const defaultTexts = [
    "Welcome!",
    "Hello World",
    "Type here...",
    "Sample Text",
    "Edit me",
  ];

  // Pick a random default text
  var randomText =
    defaultTexts[Math.floor(Math.random() * defaultTexts.length)];

  var newTextbox = new fabric.Textbox(randomText, {
    // Use random default text
    width: 200,
    fontSize: 20,
    metadata: { username: username, password: password },
  });

  var position = findAvailablePosition(newTextbox);
  newTextbox.set({ left: position.left, top: position.top });
  canvas.add(newTextbox);
  canvas.setActiveObject(newTextbox);
  canvas.renderAll();
  closeModal(); // Close modal after adding textbox
  saveCanvasState(); // Save state after adding textbox
}

// Function to close the modal
function closeModal() {
  document.getElementById("textboxModal").style.display = "none";
}

// Event listener to close modal if clicked outside of it
window.addEventListener("click", function (event) {
  var modal = document.getElementById("textboxModal");
  if (event.target !== modal && !modal.contains(event.target)) {
    // closeModal(); // Comment out or remove this line to prevent closing when clicking outside
  }
});

// Event listener for the button to remove the selected textbox
document.getElementById("removeTextbox").addEventListener("click", function () {
  var activeObjects = canvas.getActiveObjects();

  var inputUsername = prompt("Enter your username:");
  var inputPassword = prompt("Enter your password:");

  if (activeObjects.length === 1) {
    const isUsernameValid =
      activeObjects[0].metadata?.username === String(inputUsername);
    const isPasswordValid =
      activeObjects[0].metadata?.password === String(inputPassword);

    if (!isUsernameValid || !isPasswordValid) {
      alert("Incorrect username or password!");
      return;
    }

    // remove the active object
    canvas.remove(activeObjects[0]);
    canvas.discardActiveObject(); // Clear selection after removal
    canvas.renderAll();
    saveCanvasState(); // Save state after removing textbox

    return;
  }

  if (activeObjects.length > 0) {
    if (inputUsername === "admin" && inputPassword === "1234") {
      activeObjects.forEach(function (object) {
        if (object.type === "textbox") {
          canvas.remove(object);
        }
      });

      canvas.discardActiveObject(); // Clear selection after removal
      canvas.renderAll();
      saveCanvasState(); // Save state after removing textbox
    } else {
      alert("Incorrect username or password!");
    }
  } else {
    alert("No textbox is selected!");
  }
});

// Function to save the canvas state to JSON
function saveCanvasState() {
  var json = canvas.toJSON();
  console.log("Canvas state saved:", json);
  // Here you can store the json object wherever you need
  localStorage.setItem("canvasState", JSON.stringify(json));
}

// Event listener for password input to submit on Enter key press
document
  .getElementById("password")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      var username = document.getElementById("username").value;
      var password = document.getElementById("password").value;

      if (!username || !password) {
        alert("Type any value");
        if (!username) {
          document.getElementById("username").focus();
        } else {
          document.getElementById("password").focus();
        }
      }

      const isValidUsername = username === activeObjects[0].metadata.username;
      const isValidPassword = password === activeObjects[0].metadata.password;

      if (isValidUsername && isValidPassword) {
        addTextbox();
      } else {
        alert("Invalid username or password");
      }
    }
  });

// Add event listener for object modifications
canvas.on("object:modified", function () {
  saveCanvasState(); // Save the canvas state to local storage
});
