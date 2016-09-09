var roleUpgrader = {

    bodyparts: function(max_energy){
        
        let parts = [CARRY,CARRY,CARRY,MOVE,MOVE];
        let costs =  3*BODYPART_COST.carry + 2*BODYPART_COST.move;
        let minsteps = 3;
        let maxsteps = 15;
        
        let step_parts = [WORK]
        let step_costs = BODYPART_COST.work;
        //roads = 2 parts and 1 move part!
        for(let i = 0; i < minsteps || (i < maxsteps &&  costs + step_costs < max_energy);i++){
            parts.push.apply(parts, step_parts);
            costs +=  step_costs;
        }
        return parts;
       
    },
    
    /** @param {Creep} creep **/
    wait: function(creep){
        if(creep.memory.timeToWait && creep.memory.timeToWait > Game.time){
            return true;
        }
        return false
        
    },
    /** @param {Creep} creep **/
    sleep: function(creep,ticks){
        creep.memory.timeToWait = Game.time + ticks;
        return creep.memory.timeToWait;
    },


    initMemory: function(){
        return {role:"upgrader"};
    },
    /** @param {Creep} creep **/
    run: function(creep) {
        
        if(this.wait(creep)){
            return;
        }

        if(creep.memory.upgrading && creep.carry.energy == 0) 
        {
            creep.memory.upgrading = false;
        }
        if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) 
        {
            creep.memory.upgrading = true;
        }

        if(creep.memory.upgrading) 
        {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) 
            {
                creep.moveTo(creep.room.controller);
            }
        }
        else 
        {
            if(creep.room.storage)
            {
                if(creep.room.storage.store && creep.room.storage.store[RESOURCE_ENERGY] > 5000){
                    var container = creep.room.storage;
                    if(creep.withdraw(container,RESOURCE_ENERGY,Math.min(container.store[RESOURCE_ENERGY], creep.carryCapacity - creep.carry.energy)) == ERR_NOT_IN_RANGE) 
                    {
                        creep.moveTo(container);
                    }
                }
                else {
                    this.sleep(creep,50);
                }
            }
            else
            {
                var sources = creep.room.find(FIND_STRUCTURES, 
                {
                    filter: (structure) => 
                    {
                        return ((structure.structureType == STRUCTURE_CONTAINER) && structure["store"] && structure.store[RESOURCE_ENERGY] > 250);
                    }
                });
                if(sources.length > 0)
                {
                    var source = creep.pos.findClosestByPath(sources);
                    if(source != null && creep.withdraw(source,RESOURCE_ENERGY,Math.min(source.store[RESOURCE_ENERGY], creep.carryCapacity - creep.carry.energy)) == ERR_NOT_IN_RANGE) 
                    {
                        creep.moveTo(source);
                    }
                }
            }
        }
    }
};

module.exports = roleUpgrader;