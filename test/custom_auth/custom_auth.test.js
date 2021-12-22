'use strict';

const expect = require("chai").expect;
const request = require("supertest");

describe("API — Custom Auth Flow", () => {
  const server = request("http://localhost:3000");
  
  it("Warmup: POST /custom_auth", (done) => {
    server.post("/custom_auth")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

  it("POST /custom_auth", (done) => {
    server.post("/custom_auth")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

});