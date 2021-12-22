'use strict';

const expect = require("chai").expect;
const request = require("supertest");

describe("API — Section", () => {
  const server = request("http://localhost:3000");
  
  it("Warmup: POST /section", (done) => {
    server.post("/section")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

  it("POST /section", (done) => {
    server.post("/section")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

});