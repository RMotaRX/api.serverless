'use strict';

const expect = require("chai").expect;
const request = require("supertest");

describe("API — Sync", () => {
  const server = request("http://localhost:3000");
  
  it("Warmup: GET /sync/{id}", (done) => {
    server.get("/sync/IdMessageTest")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

  it("GET /sync/{id}", (done) => {
    server.get("/sync/IdMessageTest")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

  // it("POST /sync", (done) => {
  //   server.post("/sync")
  //     .expect(200)
  //     .end((error, result) => {
  //       if (error) return done(error);
  //       return done();
  //     });
  // });

});