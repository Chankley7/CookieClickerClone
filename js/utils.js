const GameUtils = {
    formatNumber(num, isFractional = false) {
        if (num < 1000) {
            if (isFractional && num % 1 !== 0) return num.toFixed(1);
            return Math.floor(num).toString();
        }
        
        const suffixes = ["", " million", " billion", " trillion", " quadrillion", " quintillion", " sextillion"];
        const suffixNum = Math.floor(("" + Math.floor(num)).length / 3);
        
        let shortValue = parseFloat((num / Math.pow(1000, suffixNum)).toPrecision(3));
        if (shortValue % 1 !== 0) {
            shortValue = shortValue.toFixed(1);
        }
        
        if (suffixNum === 1) {
            return Math.floor(num).toLocaleString();
        }
        
        return shortValue + suffixes[suffixNum - 1]; 
    },

    random(min, max) {
        return Math.random() * (max - min) + min;
    }
};
