// imports
// data
import { features } from "./data.js";
// classes
import { MemoryData, OperandAndOperator, HistoryData, AriaExpanded } from "./classes.js";

//---------------------------------------------------------------------

// Variables

// HTML elements
const exitBtns = document.querySelectorAll('.exit')
const screenshot  = document.querySelector('#screenshot img');
const prevAndNextArrows = document.querySelectorAll('.arrow');
const currentScreenshot = document.querySelectorAll('.crt-scr');
const featureTitle = document.querySelector('#description h4');
const featureDescription = document.querySelector('#description p');
const nav = document.getElementById('nav');
const currentOperation = document.getElementById('current-operation');
const result = document.getElementById('result');
const memoryButtons = document.querySelectorAll('.memory');
const labelForm = document.getElementById('label-form');
const memoryName = document.querySelector('.label-value input');
const saveToMemory = document.querySelector('.label-value button');
const memoryList = document.querySelector('#current-memory div');
const memoryContainer = document.getElementById('memory-container');
const rightButtons = document.querySelectorAll('.right');
const spButtons = document.querySelectorAll('.special');
const digits = document.querySelectorAll('.digit');
const dot = document.getElementById('dot');
const sign = document.getElementById('sign');
const historyLog = document.getElementById('history-log');
const cancelDelete = document.getElementById('cancel');
// aria-expanded elements
const navIcon = new AriaExpanded(document.getElementById('nav-icon'));
const historyIcons = [...document.querySelectorAll('.history')].map(h => new AriaExpanded(h));
const guideIcons = [...document.querySelectorAll('.guide')].map(g => new AriaExpanded(g));
const memorySave = new AriaExpanded(memoryButtons[4]);
const showMemory = new AriaExpanded(memoryButtons[0]);
const exitToButtons = new AriaExpanded(document.getElementById('exit-to-buttons'));
const equalSign = new AriaExpanded(rightButtons[5]);
const clearHistory = new AriaExpanded(document.getElementById('clear'));
const confirmDelete = new AriaExpanded(document.getElementById('confirm'));

[navIcon, ...historyIcons, ...guideIcons, clearHistory, confirmDelete]
    .forEach(elt =>{ listen(elt.element, ()=> elt.showControls());});
// used regular expressions
const opRegex = /[÷×\+-]/;
const spRegex = /[!%²√]|1\//;
const lastCharRegex = /\d|\)/;
// boolean that determines whether to reset current operation and start a new one or not
let isNewCalc = false;
// boolean that indicates whether a pop-up is open
let isOpen = false;
// features infos
let featureIndex = 0;
// remove the default Enter keydown event for buttons
const button = document.getElementsByTagName('button');
Array.from(button).forEach(btn =>{
    btn.addEventListener('keydown', e =>{
        if(e.key === 'Enter'){
            e.preventDefault();
            e.stopPropagation();
        }
    })
}) 

// load saved memory values
let memory = JSON.parse(localStorage.getItem('memory') || '[]')
            .map(MemoryData.fromJSON);
displayData(memory, memoryList);
if(memory.length === 0) disableBtn(true); // disable M+, M-, and MR if memory is empty
// load history operation
let currentHistory = JSON.parse(localStorage.getItem('history') || '[]')
                    .map(HistoryData.fromJSON);
displayData(currentHistory, historyLog);
// show No history text if history is empty
if(currentHistory.length === 0){
    switchDisplay(confirmDelete, equalSign);
}

// event listeners for all the buttons-------------------------------------------------------------------------- :
// show and hide the 'guide' window
listen(guideIcons[0].element, e =>{
        e.stopPropagation();
        guideIcons[0].docListener();
        featureInfo(featureIndex);
});
listen(guideIcons[1].element, ()=>{
    guideIcons[1].docListener();
    featureInfo(featureIndex);
});
listen(exitBtns[0], ()=> guideIcons[1].animationHide());
// show next or previous guide screenshot and instructions
prevAndNextArrows.forEach((arrow, i) =>{
    listen(arrow, ()=>
        i===0 ? featureIndex =  prevAndNext(0,1, featureIndex)
        : featureIndex =  prevAndNext(1,0, featureIndex)
    )
});
// hide nav when an option clicked
listen(nav, e => {
    if(e.target !== e.currentTarget) {
        navIcon.animationHide();
    }
});
// hide and show history
listen(exitBtns[1], ()=> historyIcons[1].animationHide());

listen(historyIcons[1].element , () =>{
    historyIcons[1].docListener();
});
// expand history operation if it overflows
listen(historyLog, e=>{
    if(!e.target.matches('.history-operation')) return;
    if(e.target.scrollHeight > e.target.clientHeight 
        || e.target.classList.contains('expanded')) 
    e.target.classList.toggle('expanded');
});
// cancel or confirm delete
[cancelDelete, confirmDelete.element].forEach((del, i) =>
    listen(del, ()=> {
        clearHistory.animationHide();
        if(i === 1){
            currentHistory.splice(0);
            setStorage('history', []);
            historyLog.innerHTML = '';
            switchDisplay(confirmDelete, equalSign);
        }
    })
);
// show and hide the 'icons' window
listen(navIcon.element, e => {
    e.stopPropagation();
    navIcon.docListener();
});
// toggle btw current memory and buttons
listen(showMemory.element, ()=> {
    if(exitToButtons.expandState) {
        switchDisplay(showMemory, exitToButtons);
    };
});
listen(exitToButtons.element, ()=> {
    if(showMemory.expandState) {
        switchDisplay(exitToButtons, showMemory);
    };
});
// adding current result to the last saved value in memory
listen(memoryButtons[1], ()=>{
    if(result.innerText !== '') 
        memory[0].value += Number(result.innerText);
});
// subtracting current result from the last saved value in memory
listen(memoryButtons[2], ()=>{
    if(result.innerText !== '') 
        memory[0].value -= Number(result.innerText);
});
[memoryButtons[1], memoryButtons[2]].forEach(mem =>{
    listen(mem, ()=>{
        setStorage('memory', memory);
        const memoryValue = memoryContainer
                            .firstElementChild
                            .lastElementChild;
        memoryValue.textContent = memory[0].value;
    })
});
// recalling the last saved value
listen(memoryButtons[3], ()=> {
    isNewCalc = recallValue(0);
    memoryContainer.firstElementChild.remove();
});
// show the label-value window to name the value and save it to memory
listen(memorySave.element, () =>{
    if(result.innerText !== '') {
        memorySave.showControls();
        disableBtn(false);
        isOpen = true;
        memoryName.focus();
    };
});
// add current value to memory
btnsListener(saveToMemory, () =>{
    addData(memory, memoryList, 'memory', MemoryData, 
        memoryName.value, Number(result.innerText));
    memoryName.value = '';
    memorySave.hideControls();
    isOpen = false;
})
labelForm.addEventListener('submit', e => e.preventDefault());
// clear memory
listen(memoryButtons[5], ()=>{
    memory = [];
    memoryList.innerHTML = '';
    setStorage('memory', []);
    disableBtn(true);
})
// add the clicked memory value to the display
listen(memoryContainer, e=>{
    if(!e.target.matches('.memory-value')) return;
    const memoryValues = Array.from(memoryContainer.querySelectorAll('.memory-value'));
    const index = memoryValues.indexOf(e.target);

    isNewCalc = recallValue(index);
    memoryContainer.removeChild(memoryValues[index]);
})

// Clear All display
btnsListener(spButtons[2], ()=> isNewCalc = startNew(true));
// special operations buttons like !, % ...
spButtons.forEach((button,i) =>{
    btnsListener(button, ()=>{
        isNewCalc = continueCurrent(isNewCalc);
        specialCalc(i, button.id);
    });
})

// Equal button
btnsListener(equalSign.element,() => {
    if(!isNewCalc) isNewCalc = displayResult(true)});
// Delete button 
btnsListener(rightButtons[0], ()=>{
    isNewCalc = false;
    toggleSize();
    const lastChar = currentOperation.innerText.at(-1);
    if(lastChar === ')' || spRegex.test(lastChar)){
        currentOperation.innerText = currentOperation.innerText.slice(0,lastOpIndex());
    }else{ 
        currentOperation.innerText = currentOperation.innerText
        .slice(0,currentOperation.innerText.length -1);
    }
    displayResult(false);
});
// operation buttons
rightButtons.forEach((button,i) => {
    if(i!==0 && i!==5){
        btnsListener(button, ()=>{
            isNewCalc = continueCurrent(isNewCalc);
            const lastChar = currentOperation.innerText.at(-1);
            if(lastCharRegex.test(lastChar) || spRegex.test(lastChar)){
                currentOperation.innerText += ' ' + button.textContent;
            }
        })
    }
});
// digit buttons
digits.forEach(digit => {
    btnsListener(digit, ()=>{
        isNewCalc = startNew(isNewCalc);
        const lastChar = currentOperation.innerText.at(-1)
        if(lastChar !== ")" && !spRegex.test(lastChar)){
            currentOperation.innerText += digit.textContent ;
            displayResult(false);
        }
    })
});
// float numbers button
btnsListener(dot, ()=>{
    isNewCalc = continueCurrent(isNewCalc);
    const lastChar = currentOperation.innerText.at(-1);
    if(!isNaN(Number(lastChar))){
        const lastOperand = currentOperation.innerText.slice(lastOpIndex()+1 , -1);  // get the last operand 
        if(!lastOperand.includes('.')) currentOperation.innerText += '.';   // only if the last operand is not a float
    }
    if(opRegex.test(lastChar) || !lastChar) currentOperation.innerText += ' 0.';  // only at the beginning or after an operator
});
// inverting sign button
btnsListener(sign, ()=>{    // if the last number is a special
    isNewCalc = continueCurrent(isNewCalc);
    const currText = currentOperation.innerText;
    let opIndex = lastOpIndex();
    let lastNumber = currText.slice(opIndex, currText.length);
    if(lastCharRegex.test(currText.at(-1))){
        let sp = '';
        if(spRegex.test(lastNumber)){
            sp = lastNumber.match(spRegex)[0];
            lastNumber = lastNumber.replace(sp,'');
        }
        if(Number(lastNumber.replace(/\((.+)\)/,'$1')) >= 0){
            currentOperation.innerText = currText.slice(0,opIndex) +  '(-' + sp + lastNumber + ')';
        }else{
            (sp === '√' || sp === '1/') 
                ? currentOperation.innerText = currText.slice(0,opIndex) +  
                    sp + lastNumber.replace(/\((.+)\)/,'$1').slice(1,lastNumber.length)
                : currentOperation.innerText = currText.slice(0,opIndex) +  
                    lastNumber.replace(/\((.+)\)/,'$1').slice(1,lastNumber.length) + sp;
        }
    }
    if(spRegex.test(currText.at(-1))) 
        currentOperation.innerText = currText.slice(0,opIndex) +  '(-' +  lastNumber + ')' ;
    displayResult(false)
});


// Functions ---------------------------------------------------------------------------------------------------:

// switch display btw 2 containers 
function switchDisplay(contToShow, contToHide){
    contToShow.showControls();
    contToHide.hideControls()
}
// display current feature infos
function featureInfo (index, img = screenshot, title = featureTitle, 
                    description = featureDescription, arr=features){
    img.src = arr[index].imgSrc;
    img.alt = arr[index].alt;
    title.innerText = arr[index].featureTitle;
    description.innerText = arr[index].featureDescription;
}
// show next or previous feature info
function prevAndNext (i, j, index, arrows = prevAndNextArrows, 
                        current = currentScreenshot){
    if(index === j*13) {
        toggleDisplay(arrows[j], false);
    }
    const prevOrNext = (index + 1)*i + (index - 1)*j;
    featureInfo(prevOrNext);
    if(prevOrNext === i*13) {
        toggleDisplay(arrows[i], true);
    }
    current[index].classList.remove('index');
    current[index].removeAttribute('aria-current');
    current[prevOrNext].classList.add('index');
    current[prevOrNext].setAttribute('aria-current', 'true');

    return prevOrNext;
}
//--------------------------------------------------------------------------------

// listen for click events
function listen(element, callback){
    element.addEventListener('click', callback);
}
// keyboard keys event for calculator's buttons
function btnsListener(elt, callback){
    listen(elt, callback);
    document.addEventListener('keydown', e =>{
        if(e.key === elt.dataset.key && !isOpen) callback();
    })
}
// toggle the display an element + accessibility
function toggleDisplay (elt, state){
    elt.hidden = state;
    elt.toggleAttribute('inert');
}
// recall a value from memory to the display
function recallValue (index, mem = memory, op = currentOperation){
    if(!opRegex.test(op.innerText.at(-1))) startNew(true);
    op.innerText += mem[index].value;
    mem.splice(index, 1);
    setStorage('memory', mem);
    if(mem.length === 0) disableBtn(true);

    return displayResult(false);
}
// display current data values in memory and history
function displayData (data, dataList){
    dataList.innerHTML = '';
    data.forEach(d =>{
        dataList.innerHTML += d.display();
    });
}
// set item in localStorage
function setStorage(storage, arr){
    localStorage.setItem(storage, JSON.stringify(arr));
}
// add data to its dataArray, dataList and localStorage
function addData(dataArray, dataList, storage, className, ...args){
    const data = new className(...args);
    dataArray.unshift(data);
    setStorage(storage, dataArray);
    dataList.insertAdjacentHTML('afterbegin', data.display());
}
// disable or enable MR,M+ and M-
function disableBtn (disabled, btns = memoryButtons){
    for(let i=1; i<4;i++) btns[i].disabled = disabled;
}
//-----------------------------------------------------------------------------------

// continuing from last result
function continueCurrent(boolean, op = currentOperation, res = result){
    if(boolean){
        if(res.innerText.includes('e+')){
            alert('Very large Number!!!');
            startNew(boolean);
        }else if(res.innerText.includes('e-')){
            toggleSize();
            op.innerText = '0';
            res.innerText = '';
            toggleDisplay(res, true);
        }
        toggleSize();
        Number(res.innerText)>= 0
            ?op.innerText = res.innerText
            :op.innerText = `(${res.innerText[0]}${res.innerText.slice(1,res.innerText.length)})`;
        res.innerText = '';
        toggleDisplay(res, true);
    }
    return false;
}
// start a new operation
function startNew(boolean, op = currentOperation, res = result){
    if(boolean){
        toggleSize();
        op.innerText = '';
        res.innerText = '';
        toggleDisplay(res, true);
    }
    return false;
}
// reverse and sqrt operations
function revAndSqrt(sp, op = currentOperation, res = result){
    const currTxt = op.innerText;
    if(!isNaN(Number(currTxt.at(-1))) ){
        let opIndex = lastOpIndex();
        const lastNumber = currTxt.slice(opIndex, currTxt.length).replace(/\((.+)\)/,'$1');
        if(Number(lastNumber) !== 0 || Number(lastNumber) !== 1){
            op.innerText = `${currTxt.slice(0,opIndex)}${sp}(${lastNumber})`;
            displayResult(false);
        }
    }
}
// other special operations
function restSp(sp,op=currentOperation, res= result){
    const currTxt = op.innerText;
    if(!isNaN(Number(currTxt.at(-1)))){
        let opIndex = lastOpIndex();
        const lastNumber = currTxt.slice(opIndex, currTxt.length).replace(/\((.+)\)/,'$1');
        if(sp === '!' && !Number.isInteger(Number(lastNumber))){
            alert('x must be an integer')
            return;
        }
        op.innerText = `${currTxt.slice(0,opIndex)}(${lastNumber})${sp}`;
        displayResult(false);
    }
}
// display special functions
function specialCalc(i,sp){
    if(i === 0 || i === 1) revAndSqrt(sp);
    else restSp(sp);
}
// to display the result of the current operation
function displayResult(isFinal, op = currentOperation, res = result,
                        currentHist = currentHistory, hist = historyLog,
                        equal = equalSign, confirm = confirmDelete){
    const current = currentOps(op.innerText, indexOfOperators(op.innerText));
    if(current.length > 1 || spRegex.test(op.innerText)){  // show result only if there are 2 operands or a special function
        const lastResult = calculate(current);
        if(Number.isFinite(lastResult)){
            toggleDisplay(res, false);
            res.innerText = lastResult;
            if(isFinal) {
                toggleSize(op, res);
                addData(currentHist, hist, 'history', HistoryData, 
                    op.innerText + ' = ' + res.innerText);
                if(!equal.expandState) switchDisplay(equal, confirm);
            };
        }else{
            res.innerText = '';
            if(isFinal) {
                alert("Infinity!!!");
                startNew(true);
            }
        }
    }else {
        res.innerText = '';
        toggleDisplay(res, true);
        isFinal = false;
    }
    return isFinal;
}
// toggle font size btw result and current operation
function toggleSize(res = result, op = currentOperation){
    res.style.fontSize = '.7em';
    op.style.fontSize = '1.5em';
}
// get the last operator index + 1 , if there isn't an operator it returns 0;
function lastOpIndex(op = currentOperation){
    let lastOp;
    const operators = indexOfOperators(op.innerText);
    if(operators.length > 0){
        if(operators.length === 1){
            lastOp = operators[0]+1;
        }else{
            lastOp = operators.at(-1)+1;
        }
    }else {
        lastOp = 0;
    }
    return lastOp;
}
//-----------------------------------------------------------------------------------

// function that returns all the current operators in the current operation
function indexOfOperators(str){
    let indexes = [];
    for (let i=1; i<str.length;i++) {
        if(opRegex.test(str[i]) && str[i-1] !== '('){    // excluding the negative numbers
            indexes.push(i); 
        }
    }
    return indexes;
}
// function that breaks current operation into and array of operands and their correspondent operators
function currentOps(str, indexes){
    let currOp = [];
    let i = 0;
    for (const index of indexes) {
        let num = str.slice(i,index).replace(/\((.+)\)/,'$1');
        currOp.push(new OperandAndOperator(num, str[index]));
        i = index + 1;
    }
    let lastNum = str.slice(i, str.length).replace(/\((.+)\)/,'$1');
    if(lastNum !== ''){
        currOp.push(new OperandAndOperator(lastNum, ''));
    }
    return currOp;
}
// algo that calculates an operation : is start calculating priority operation first then 
//                                      calculates the rest of the operation
function calculate(arr){
    let hasPriorities = true;
    while(hasPriorities){
        hasPriorities = false;
        for(let i = 0; i<arr.length -1; i++){
            if(arr[i].operator === '×' || arr[i].operator === '÷'){
                arr[i].operate(arr[i+1]);
                arr.splice(i+1, 1);
                if(arr[i].operator === '×' || arr[i].operator === '÷'){
                    hasPriorities = true;
                    break;
                }
            }
        }
    }
    if(arr.length === 1) return arr[0].number;
    let lastResult = arr[0];
    let i = 1;
    while(i < arr.length){
        lastResult.operate(arr[i]);
        i++;
    }
    return lastResult.number;
}