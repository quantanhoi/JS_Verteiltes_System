'use strict';
// wertpapier.mjs

export class Wertpapier {
    constructor(kurzel, preis) {
        this.kurzel = kurzel;
        this.preis = preis
    }
    updatePrice(newPrice) {
        this.preis = newPrice;
    }
}
export const MSFT = new Wertpapier('MSFT', 300);
export const LSFT = new Wertpapier('LSFT', 280);
