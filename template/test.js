'use strict';

const expect = require("chai").expect;
const request = require("supertest");

describe("API — Template", () => {
  const server = request("http://localhost:3000");
  
  it("Warmup: POST /template", (done) => {
    server.post("/template")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

  it("POST /template", (done) => {
    server.post("/template")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

});