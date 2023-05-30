export default class BankService {

    constructor(bank) {
        this.bank = bank;
    }
    grpcCalculatePortfolio(call, callback) {
        const portfolio = this.calculatePortfolio();
        callback(null, { portfolio });
    }

    grpcAddWertpapier(call, callback) {
        const { kurzel, count } = call.request;
        const wertpapier = this.getWertpapierByKurzel(kurzel);
        if (wertpapier) {
            this.addWertPapier(wertpapier, count, wertpapier.preis);
            callback(null, { success: true });
        } else {
            callback({
                code: grpc.status.NOT_FOUND,
                details: "Invalid Wertpapier Kurzel",
            });
        }
    }

}