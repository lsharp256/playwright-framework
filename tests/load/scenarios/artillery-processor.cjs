module.exports = {
  generateUserData: (requestParams, context, events, done) => {
    const randomId = Math.floor(Math.random() * 10000);
    context.vars.firstName = `ArtilleryUser_${randomId}`;
    context.vars.lastName = `Test_${randomId}`;
    context.vars.age = 25 + (randomId % 40);
    return done();
  },
};
