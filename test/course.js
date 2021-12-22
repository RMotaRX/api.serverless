'use strict';

const expect = require("chai").expect;
const request = require("supertest");

describe("API — Course", () => {
  const server = request("http://localhost:3000");
  
  it("Warmup: POST /course", (done) => {
    server.post("/course")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

  it("POST /course", (done) => {
    server.post("/course")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

});