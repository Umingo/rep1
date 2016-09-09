var roleBuilder = {


    bodyparts: function(max_energy){
        return [WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
    },
    initMemory: function(){
        return {role:"builder"};
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.carry.energy == 0) {
            creep.memory.building = false;
        }
        if(creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
        }

        if(creep.memory.building) {
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length) {
                if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0]);
                }
            }
        }
        else {
             var sources = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return ((structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) && structure["store"] && structure.store[RESOURCE_ENERGY] > 250);
                    }
            });
            if(sources.length > 0){
                
                var source = creep.pos.findClosestByPath(sources);
                if(creep.withdraw(source,RESOURCE_ENERGY,Math.min(source.store[RESOURCE_ENERGY], creep.carryCapacity - creep.carry.energy)) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source);
                }
            }
        
        }
    }
};

module.exports = roleBuilder;