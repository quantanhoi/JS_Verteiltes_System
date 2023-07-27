// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('grpc');
var bankService_pb = require('./bankService_pb.js');

function serialize_LoanRequest(arg) {
  if (!(arg instanceof bankService_pb.LoanRequest)) {
    throw new Error('Expected argument of type LoanRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_LoanRequest(buffer_arg) {
  return bankService_pb.LoanRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_LoanResponse(arg) {
  if (!(arg instanceof bankService_pb.LoanResponse)) {
    throw new Error('Expected argument of type LoanResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_LoanResponse(buffer_arg) {
  return bankService_pb.LoanResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_TransferRequest(arg) {
  if (!(arg instanceof bankService_pb.TransferRequest)) {
    throw new Error('Expected argument of type TransferRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_TransferRequest(buffer_arg) {
  return bankService_pb.TransferRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_TransferResponse(arg) {
  if (!(arg instanceof bankService_pb.TransferResponse)) {
    throw new Error('Expected argument of type TransferResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_TransferResponse(buffer_arg) {
  return bankService_pb.TransferResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var BankServiceService = exports.BankServiceService = {
  requestLoan: {
    path: '/BankService/RequestLoan',
    requestStream: false,
    responseStream: false,
    requestType: bankService_pb.LoanRequest,
    responseType: bankService_pb.LoanResponse,
    requestSerialize: serialize_LoanRequest,
    requestDeserialize: deserialize_LoanRequest,
    responseSerialize: serialize_LoanResponse,
    responseDeserialize: deserialize_LoanResponse,
  },
  transferFunds: {
    path: '/BankService/TransferFunds',
    requestStream: false,
    responseStream: false,
    requestType: bankService_pb.TransferRequest,
    responseType: bankService_pb.TransferResponse,
    requestSerialize: serialize_TransferRequest,
    requestDeserialize: deserialize_TransferRequest,
    responseSerialize: serialize_TransferResponse,
    responseDeserialize: deserialize_TransferResponse,
  },
};

exports.BankServiceClient = grpc.makeGenericClientConstructor(BankServiceService);
