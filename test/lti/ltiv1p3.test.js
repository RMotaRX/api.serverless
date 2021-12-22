'use strict';

const expect = require("chai").expect;
const request = require("supertest");

describe("API — LTI 1.3", () => {
  const server = request("http://localhost:3000");
  
  it("Warmup: POST /lti/v1p3/tools", (done) => {
    server.post("/lti/v1p3/tools")
      .send({
        "owner": "tool-dev-xyxxx",
        "secret": "09s994mlx0982*6g5s2.ssr5)98kfj(1lfcslfs-05ljz",
        "name": "Teste APP"
      })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

  it("POST /lti/v1p3/tools", (done) => {
    server.post("/lti/v1p3/tools")
      .send({
        "owner": "tool-dev-xyxxx",
        "secret": "09s994mlx0982*6g5s2.ssr5)98kfj(1lfcslfs-05ljz",
        "name": "Teste APP"
      })
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .end((error, result) => {
        if (error) return done(error);
        return done();
      });
  });

});