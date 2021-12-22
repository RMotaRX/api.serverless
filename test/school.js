'use strict';

const expect = require("chai").expect;
const request = require("supertest");

describe("API — School", () => {
  const server = request("http://localhost:3000");
  
  it("Warmup: POST /school", (done) => {
    server.post("/school")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

  it("POST /school", (done) => {
    server.post("/school")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

});