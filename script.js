'use strict';

(function () {
    const MAX_DIGITS = 12;

    const screenEl = document.getElementById('screen');
    const keypad = document.getElementById('keypad');

    // What the operator buttons say, so the display matches the keypad.
    const SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };

    // The whole calculator is these four values.
    let current = '0';     // the number being typed
    let previous = null;   // the stored left-hand operand
    let operator = null;   // the pending operator, or null
    let overwrite = true;  // should the next digit replace current instead of appending?

    // ---------- arithmetic ----------

    // Trims floating-point noise: 0.1 + 0.2 becomes "0.3", not "0.30000000000000004".
    function format(value) {
        if (!isFinite(value)) return 'Error';
        return String(parseFloat(value.toPrecision(MAX_DIGITS)));
    }

    function operate(a, op, b) {
        switch (op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return a / b;
            default: return b;
        }
    }

    // ---------- state changes ----------

    function clear() {
        current = '0';
        previous = null;
        operator = null;
        overwrite = true;
    }

    // Fold previous/operator/current down into a single result.
    function resolve() {
        current = format(operate(previous, operator, Number(current)));
        previous = null;
        operator = null;
        overwrite = true;
    }

    function digit(d) {
        if (current === 'Error') clear();
        if (overwrite) {
            current = d;
            overwrite = false;
        } else if (current === '0') {
            current = d;
        } else if (current.replace(/\D/g, '').length < MAX_DIGITS) {
            current += d;
        }
    }

    function decimal() {
        if (current === 'Error') clear();
        if (overwrite) {
            current = '0.';
            overwrite = false;
        } else if (!current.includes('.')) {
            current += '.';
        }
    }

    function chooseOperator(op) {
        if (current === 'Error') return;
        // Only fold if an operand was actually typed, so pressing two
        // operators in a row swaps the pending one instead of computing.
        if (operator !== null && !overwrite) resolve();
        previous = Number(current);
        operator = op;
        overwrite = true;
    }

    function equals() {
        if (operator === null || current === 'Error') return;
        resolve();
    }

    function negate() {
        if (current === 'Error' || current === '0') return;
        current = current.startsWith('-') ? current.slice(1) : '-' + current;
    }

    function percent() {
        if (current === 'Error') return;
        current = format(Number(current) / 100);
        overwrite = true;
    }

    function backspace() {
        if (current === 'Error' || overwrite) return clear();
        current = current.slice(0, -1);
        if (current === '' || current === '-') current = '0';
    }

    // ---------- wiring ----------

    // The display is derived from state, never stored: with an operator
    // pending it reads "12 +", then "12 + 8" once the next number is typed.
    function render() {
        if (operator === null) {
            screenEl.textContent = current;
        } else if (overwrite) {
            screenEl.textContent = `${format(previous)} ${SYMBOLS[operator]}`;
        } else {
            screenEl.textContent = `${format(previous)} ${SYMBOLS[operator]} ${current}`;
        }
    }

    function apply(action, value) {
        switch (action) {
            case 'digit':     digit(value); break;
            case 'operator':  chooseOperator(value); break;
            case 'decimal':   decimal(); break;
            case 'equals':    equals(); break;
            case 'clear':     clear(); break;
            case 'negate':    negate(); break;
            case 'percent':   percent(); break;
            case 'backspace': backspace(); break;
            default: return;
        }
        render();
    }

    // One listener on the container rather than 19 on the buttons.
    keypad.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (button) apply(button.dataset.action, button.dataset.value);
    });

    const KEY_MAP = {
        '+': ['operator', '+'],
        '-': ['operator', '-'],
        '*': ['operator', '*'],
        '/': ['operator', '/'],
        '.': ['decimal'],
        ',': ['decimal'],
        '=': ['equals'],
        'Enter': ['equals'],
        'Backspace': ['backspace'],
        'Escape': ['clear'],
        '%': ['percent']
    };

    document.addEventListener('keydown', (event) => {
        const isDigit = event.key.length === 1 && event.key >= '0' && event.key <= '9';
        const mapped = KEY_MAP[event.key];
        if (!isDigit && !mapped) return;

        // Stops "/" opening quick-find and Enter re-triggering the last clicked button.
        event.preventDefault();
        if (isDigit) apply('digit', event.key);
        else apply(...mapped);
    });

    render();
})();
