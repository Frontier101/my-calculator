// class for memory values
export class MemoryData {
    constructor(name, value){
        this.name = name;
        this.value = value
    }
    display(){
        return `<button id="${this.value}" class="memory-value flex-space">
                    <div>${this.name}</div>
                    <div>${this.value}</div>
                </button>`;
    }
    static fromJSON(obj){
        return new MemoryData(obj.name, obj.value);
    }
}

// class for operands their successive operator
export class OperandAndOperator {
    constructor(number, operator) {
        this.number = this.calculateSpecial(number);
        this.operator = operator;
    }
    calculateSpecial(num){
        const spRegex = /[!%²√]|1\//;
        if(spRegex.test(num)){
            let sp = num.match(spRegex)[0];
            num = num.replace(spRegex, '');
            const sign = Math.sign(Number(num));
            num = Math.abs(num);
            switch(sp){
                case '!':
                    num != +0 ? num = sign * this.factorial(num): num=this.factorial(num);
                    break;
                case '²':
                    num = sign * Math.pow(num, 2);
                    break;
                case '1/':
                    num != 0 ? num = sign * (1 / num) : num = Infinity;
                    break;
                case '%':
                    num = sign * (num / 100);
                    break;
                case '√':
                    num = sign * (Math.sqrt(num));
                    break;
                default:
            }
        }
        return Number(num);
    }
    factorial(n){
        if(n < 0 || n > 10000) return Infinity; 
        if(n === 0 || n === 1)  return 1;
        return n*this.factorial(n-1);
    } 
    operate (operand){
        switch(this.operator){
            case  '÷' :
                this.number = this.number / operand.number;
                break;
            case '×' :
                this.number = this.number * operand.number;
                break;
            case '+' :
                this.number = this.number + operand.number;
                break;
            case '-' :
                this.number = this.number - operand.number;
                break;
            default:
        }
        this.operator = operand.operator;
    }
}

// class for history operations
export class HistoryData {
    constructor(operation){
        this.date = new Date().toLocaleDateString();
        this.time = new Date().toLocaleTimeString();
        this.operation = operation;
    }
    display(){
        return `<div>
                    <div class="history-date flex-space">
                        <time><em>${this.date}</em></time>
                        <time><em>${this.time}</em></time>
                    </div>
                    <div class="history-operation">${this.operation}</div>
                </div>`;
    }
    static fromJSON(obj){
        const instance = new HistoryData(obj.operation);
        Object.assign(instance, obj);   // this will overwrite current date and time 
                                        // with the history's date and time
        return instance;
    }
}

// class for each HTML element and its aria-controls
export class AriaExpanded{
    constructor(element){
        this.element = element;
        this.control = this.ariaControls();
        this.expandState = this.element.getAttribute('aria-expanded') === 'true';
        this.hide = this.hide.bind(this);
        this.clickAway = this.clickAway.bind(this);
    }
    ariaControls(){
        const id = this.element.getAttribute('aria-controls');
        return document.getElementById(id);
    }

    ariaExpand(){
        this.expandState = !this.expandState;
        this.element.setAttribute('aria-expanded', String(this.expandState));
    }
    showControls(){
        this.control.style.animation = this.control.dataset.entrance;
        this.control.classList.remove('hidden');
        this.control.removeAttribute('inert');
        this.ariaExpand();
    }
    hideControls(){
        this.control.classList.add('hidden');
        this.control.setAttribute('inert', '');
        this.ariaExpand();
    }
    animationHide(){
        this.control.style.animation = this.control.dataset.exit + ' .3s ease-out';
        this.control.addEventListener('animationend', this.hide);
        this.removeDocListener();
    }
    hide(e){
        if(e.animationName !== this.control.dataset.exit) return;
        this.hideControls();
        this.control.style.animation = '';
        this.control.removeEventListener('animationend', this.hide);
    }
    clickAway(e){
        if(!this.control.contains(e.target)){
            this.animationHide();
        }
    }
    docListener(){
        setTimeout(()=> document.addEventListener('click', this.clickAway), 0);
    }
    removeDocListener(){
        document.removeEventListener('click', this.clickAway);
    }
}