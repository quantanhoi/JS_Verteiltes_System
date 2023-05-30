// BankClient.mjs
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const PROTO_PATH = './bank.proto';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const bankProto = grpc.loadPackageDefinition(packageDefinition).bank;

export default class BankClient {
    constructor(host, port) {
        this.client = new bankProto.BankService(`${host}:${port}`, grpc.credentials.createInsecure());
    }

    calculatePortfolio() {
        return new Promise((resolve, reject) => {
            this.client.calculatePortfolio({}, (err, response) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });
    }
}
