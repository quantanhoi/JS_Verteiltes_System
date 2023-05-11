'use strict';
// wertpapier.mjs
import { EventEmitter } from 'events';

export class Wertpapier extends EventEmitter {
    constructor(kurzel, preis) {
        super();
        this.kurzel = kurzel;
        this.preis = preis
    }

    updatePrice(newPrice) {
        this.preis = newPrice;
    }
}

export const MSFT = new Wertpapier('MSFT', 300);
export const LSFT = new Wertpapier('LSFT', 280);
