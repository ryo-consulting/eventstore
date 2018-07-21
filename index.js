const eventstore = require('eventstore');
const uuid = require('uuid/v4');

const init = es => () => new Promise((resolve, reject) => es.init(err => err ? reject(err) : resolve()));

const create = es => (type, guid, event) => {
  if(!guid){
    guid = uuid();
  }
  return new Promise((resolve, reject) => {
    es.getEventStream({ aggregateId: guid, aggregate: type }, (err, stream) => {
      if(err){
        return reject(err);
      }
      stream.addEvent(event);
      stream.commit((err, stream) => err ? reject(err) : resolve(stream.eventsToDispatch[0]));
    });
  });
};

const findByAggregate = es => (guid, type) => new Promise((resolve, reject) => {
  return es.getEventStream({ aggregateId: guid, aggregate: type }, (err, stream) => err ? reject(err) : resolve(stream.events));
});

module.exports = (options) => {
  options = options || {
    mapping: {
      id: 'id',
      commitId: 'commitId',
      commitSequence: 'commitSequence',
      commitStamp: 'commitStamp',
      streamRevision: 'streamRevision'
    },
  };

  const es = eventstore(options.store);
  if(options.mapping){
    es.defineEventMappings(options.mapping);
  }

  return {
    init: init(es),
    create: create(es),
  }
};