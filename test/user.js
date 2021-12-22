'use strict';

const expect = require("chai").expect;
const request = require("supertest");

describe("API — User", () => {
  const server = request("http://localhost:3000");
  
  it("Warmup: GET /user/me", (done) => {
    server.get("/user/me")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

  it("POST /user", (done) => {
    server.post("/user")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

  it("GET /user/me", (done) => {
    server.get("/user/me")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

  it("GET /user/{id}", (done) => {
    server.get("/user/u53r-1d3n71f1c4710n-f0r-7357")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

  it("PUT /user/{id}", (done) => {
    server.put("/user/u53r-1d3n71f1c4710n-f0r-7357")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

  it("DELETE /user/{id}", (done) => {
    server.delete("/user/u53r-1d3n71f1c4710n-f0r-7357")
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

});