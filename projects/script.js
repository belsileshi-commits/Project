
//    STATE

let currentInput = "";
let historyText = "";
let isCalculated = false;
let isSecondActive = false;
let angleMode = "DEG"; // DEG or RAD
let memory = 0;

//    DOM ELEMENTS
  
const resultEl = document.getElementById("result");
const historyEl = document.getElementById("history");
const secondBtn = document.getElementById("secondBtn");
const angleModeEl = document.getElementById("angleMode");
const memoryIndicator = document.getElementById("memoryIndicator");
const buttons = document.querySelectorAll(".btn");


//    DISPLAY UPDATE

function updateDisplay() {
    resultEl.textContent = currentInput || "0";
    historyEl.textContent = historyText;
    angleModeEl.textContent = angleMode;
    angleModeEl.classList.toggle("active", true);
    memoryIndicator.textContent = memory !== 0 ? "M" : "";
    memoryIndicator.classList.toggle("active", memory !== 0);
}


//    NUMBER INPUT

function appendNumber(num) {
    if (isCalculated) {
        currentInput = "";
        historyText = "";
        isCalculated = false;
    }

    const lastNumber = currentInput.split(/[\+\-\*\/%()]/).pop();

    if (num === "." && lastNumber.includes(".")) return;

    if (currentInput === "0" && num !== ".") {
        currentInput = num;
    } else {
        currentInput += num;
    }

    updateDisplay();
}


//    OPERATOR INPUT

function appendOperator(op) {
    if (currentInput === "" && op !== "-") return;

    const lastChar = currentInput.slice(-1);
    if (["+", "-", "*", "/", "%"].includes(lastChar)) {
        currentInput = currentInput.slice(0, -1) + op;
    } else {
        currentInput += op;
    }

    isCalculated = false;
    updateDisplay();
}


//    PARENTHESIS
  
function appendParenthesis(paren) {
    if (isCalculated) {
        currentInput = "";
        historyText = "";
        isCalculated = false;
    }

    if (paren === "(") {
        currentInput += "(";
    } else {
        const open = (currentInput.match(/\(/g) || []).length;
        const close = (currentInput.match(/\)/g) || []).length;
        if (open > close) currentInput += ")";
    }

    updateDisplay();
}


//    TOGGLE SIGN
 
function toggleSign() {
    if (currentInput === "") return;

    const match = currentInput.match(/(\d+\.?\d*)$/);
    if (!match) return;

    const lastNum = match[1];
    const startIndex = currentInput.length - lastNum.length;

    if (currentInput[startIndex - 1] === "-") {
        currentInput =
            currentInput.slice(0, startIndex - 1) +
            currentInput.slice(startIndex);
    } else {
        currentInput =
            currentInput.slice(0, startIndex) +
            "-" +
            currentInput.slice(startIndex);
    }

    updateDisplay();
}

//    CLEAR / DELETE
  
function clearAll() {
    currentInput = "";
    historyText = "";
    isCalculated = false;
    updateDisplay();
}

function deleteLast() {
    currentInput = currentInput.slice(0, -1);
    updateDisplay();
}


//    TOGGLE 2ND (inverse functions)
  
function toggleSecond() {
    isSecondActive = !isSecondActive;
    secondBtn.classList.toggle("active", isSecondActive);
    document.getElementById("secondIndicator").classList.toggle("active", isSecondActive);

    // Update sin/cos/tan/log labels to inverse
    const sinBtn = document.querySelector('[data-value="sin"]');
    const cosBtn = document.querySelector('[data-value="cos"]');
    const tanBtn = document.querySelector('[data-value="tan"]');
    const logBtn = document.querySelector('[data-value="log"]');

    sinBtn.textContent = isSecondActive ? "sin⁻¹" : "sin";
    cosBtn.textContent = isSecondActive ? "cos⁻¹" : "cos";
    tanBtn.textContent = isSecondActive ? "tan⁻¹" : "tan";
    logBtn.textContent = isSecondActive ? "10ˣ" : "log";
}


//    ANGLE CONVERSION
  
function toRadians(value) {
    return angleMode === "DEG" ? (value * Math.PI) / 180 : value;
}

function fromRadians(value) {
    return angleMode === "DEG" ? (value * 180) / Math.PI : value;
}


//    FACTORIAL
  
function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    if (n > 170) return Infinity;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
}


//    APPLY FUNCTION TO CURRENT VALUE
  
function applyFunction(fn) {
    if (currentInput === "") return;

    const match = currentInput.match(/(\d+\.?\d*)$/);
    if (!match) return;

    const numStr = match[1];
    const num = parseFloat(numStr);
    const startIndex = currentInput.length - numStr.length;
    const before = currentInput.slice(0, startIndex);

    let result;

    switch (fn) {
        case "sin":
            result = isSecondActive
                ? fromRadians(Math.asin(num))
                : Math.sin(toRadians(num));
            break;
        case "cos":
            result = isSecondActive
                ? fromRadians(Math.acos(num))
                : Math.cos(toRadians(num));
            break;
        case "tan":
            result = isSecondActive
                ? fromRadians(Math.atan(num))
                : Math.tan(toRadians(num));
            break;
        case "log":
            result = isSecondActive ? Math.pow(10, num) : Math.log10(num);
            break;
        case "ln":
            result = Math.log(num);
            break;
        case "square":
            result = num * num;
            break;
        case "cube":
            result = num * num * num;
            break;
        case "power":
            currentInput = before + numStr + "**";
            updateDisplay();
            return;
        case "sqrt":
            result = Math.sqrt(num);
            break;
        case "cbrt":
            result = Math.cbrt(num);
            break;
        case "tenpow":
            result = Math.pow(10, num);
            break;
        case "exp":
            result = Math.exp(num);
            break;
        case "inverse":
            result = 1 / num;
            break;
        case "abs":
            result = Math.abs(num);
            break;
        case "factorial":
            result = factorial(num);
            break;
        default:
            return;
    }

    if (!isFinite(result) || isNaN(result)) {
        currentInput = "Error";
        historyText = "";
        isCalculated = true;
    } else {
        currentInput = before + String(Number(result.toFixed(10)));
    }

    // Reset 2nd after using an inverse function
    if (isSecondActive) toggleSecond();

    updateDisplay();
}


//    CONSTANTS (π, e)
  
function insertConstant(name) {
    if (isCalculated) {
        currentInput = "";
        historyText = "";
        isCalculated = false;
    }

    const value = name === "pi" ? Math.PI : Math.E;
    currentInput += String(Number(value.toFixed(10)));
    updateDisplay();
}


//    MEMORY FUNCTIONS
 
function memoryAction(action) {
    const currentValue = currentInput ? parseFloat(evalExpression(currentInput)) : 0;

    switch (action) {
        case "add":
            memory += isNaN(currentValue) ? 0 : currentValue;
            break;
        case "subtract":
            memory -= isNaN(currentValue) ? 0 : currentValue;
            break;
        case "recall":
            currentInput += String(Number(memory.toFixed(10)));
            break;
        case "clear":
            memory = 0;
            break;
    }

    updateDisplay();
}


//    SAFE EXPRESSION EVALUATOR

function evalExpression(expr) {
    // Replace π and e symbols if present
    expr = expr.replace(/π/g, "Math.PI").replace(/(?<![a-zA-Z])e(?![a-zA-Z])/g, "Math.E");

    // Replace ** for power (already valid in JS)
    // Factorial shorthand: 5! → factorial(5)
    expr = expr.replace(/(\d+\.?\d*)!/g, "factorial($1)");

    // Build function with math scope
    const func = new Function(
        "factorial",
        '"use strict"; return (' + expr + ');'
    );

    return func(factorial);
}


//    CALCULATE
 
function calculate() {
    if (currentInput === "") return;

    // Close any unclosed parentheses
    const open = (currentInput.match(/\(/g) || []).length;
    const close = (currentInput.match(/\)/g) || []).length;
    for (let i = 0; i < open - close; i++) currentInput += ")";

    // Remove trailing operator
    const lastChar = currentInput.slice(-1);
    if (["+", "-", "*", "/", "%"].includes(lastChar)) {
        currentInput = currentInput.slice(0, -1);
    }

    try {
        historyText = currentInput + " =";
        const result = evalExpression(currentInput);

        if (!isFinite(result) || isNaN(result)) {
            currentInput = "Error";
            historyText = "";
        } else {
            currentInput = String(Number(result.toFixed(10)));
        }

        isCalculated = true;
    } catch (error) {
        currentInput = "Error";
        historyText = "";
        isCalculated = true;
    }

    updateDisplay();
}


//    BUTTON CLICK HANDLER

buttons.forEach(button => {
    button.addEventListener("click", () => {
        const action = button.dataset.action;
        const value = button.dataset.value;

        switch (action) {
            case "number":
                appendNumber(value);
                break;
            case "operator":
                appendOperator(value);
                break;
            case "parenthesis":
                appendParenthesis(value);
                break;
            case "function":
                applyFunction(value);
                break;
            case "constant":
                insertConstant(value);
                break;
            case "memory":
                memoryAction(value);
                break;
            case "toggle-second":
                toggleSecond();
                break;
            case "toggle-sign":
                toggleSign();
                break;
            case "clear":
                clearAll();
                break;
            case "delete":
                deleteLast();
                break;
            case "equals":
                calculate();
                break;
        }
    });
});


//    KEYBOARD SUPPORT
  
document.addEventListener("keydown", (event) => {
    const key = event.key;

    if (!isNaN(key) && key !== " ") {
        appendNumber(key);
    } else if (key === ".") {
        appendNumber(".");
    } else if (["+", "-", "*", "/", "%"].includes(key)) {
        appendOperator(key);
    } else if (key === "(" || key === ")") {
        appendParenthesis(key);
    } else if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculate();
    } else if (key === "Backspace") {
        deleteLast();
    } else if (key === "Escape") {
        clearAll();
    } else if (key === "^") {
        applyFunction("power");
    } else if (key === "!") {
        applyFunction("factorial");
    } else if (key.toLowerCase() === "p") {
        insertConstant("pi");
    } else if (key.toLowerCase() === "e") {
        insertConstant("e");
    }
});

//    INIT

updateDisplay();