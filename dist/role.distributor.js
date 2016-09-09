var roleDistributer = {


    bodyparts: function(max_energy,energy){
        
   
        
        let parts = [];
        let costs = 0;
        let minsteps = 4;
        let maxsteps = 7;
        
        let step_parts = [CARRY,CARRY,MOVE]
        let step_costs = 2*BODYPART_COST.carry + BODYPART_COST.move;
        //roads = 2 parts and 1 move part!
        for(let i = 0; i < minsteps || (i < maxsteps &&  costs + step_costs < max_energy);i++){
            parts.push.apply(parts, step_parts);
            costs +=  step_costs;
        }
        return parts;
        
        
    },
    initMemory: function(){
        return {
            role:"distributer",
            recharging:true,
            energyFrom:null,
            energyTo:null
        };
    },
    /** @param {Creep} creep **/
    run: function(creep) {
        
        if(creep.memory.timeToWait && creep.memory.timeToWait > Game.time){
            return;
        }
        
        if(!creep.memory.recharging && creep.carry.energy == 0) {
            creep.memory.recharging = true;
            creep.memory.energyFrom = null;
        }
        if(creep.memory.recharging && creep.carry.energy == creep.carryCapacity) {
            creep.memory.recharging = false;
            creep.memory.energyTo = null;
        }
        
        if(creep.memory.recharging) {
            if(creep.memory.energyFrom ==  null)
            {
                if(creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 250)
                {
                            creep.memory.energyFrom = creep.room.storage.id;  
                }
                else 
                {
                    var sources = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return ((structure.structureType == STRUCTURE_CONTAINER) && structure["store"] && structure.store[RESOURCE_ENERGY] > 250)
                        }
                    });
                    if(sources.length > 0){
                        
                        var source = sources[(Math.floor(Math.random() * 10 * sources.length))%sources.length];
                        if(source != null){
                            creep.memory.energyFrom = source.id;   
                        }
                    }
                    else {
                        creep.memory.timeToWait = Game.time + 10;
                    }
                }
            }
                    
            if(creep.memory.energyFrom !=  null)
            {
                var memory_source = Game.getObjectById(creep.memory.energyFrom);
                
                if(memory_source != null && creep.withdraw(memory_source,RESOURCE_ENERGY,Math.min(memory_source.store[RESOURCE_ENERGY], creep.carryCapacity - creep.carry.energy)) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(memory_source);
                }
                else {
                    creep.memory.energyFrom = null;
                }
            }
        }
        else 
        {
            
            if(creep.memory.energyTo == null)
            {
                var targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return ((structure.structureType == STRUCTURE_EXTENSION ||
                                    structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity)
                                    || (structure.structureType == STRUCTURE_TOWER && 2*structure.energy < structure.energyCapacity);
                        }
                });
                if(targets.length > 0) 
                {
                    var target = creep.pos.findClosestByPath(targets);
                    if(target != null){
                        creep.memory.energyTo = target.id;
                    }
                }
                else {
                    creep.memory.timeToWait = Game.time + 10;
                }
            }
            if(creep.memory.energyTo != null)
            {
                var memory_to = Game.getObjectById(creep.memory.energyTo);
                    //too much energy = error ...
                    if(memory_to != null && creep.transfer(memory_to, RESOURCE_ENERGY,Math.min(creep.carry.energy,memory_to.energyCapacity - memory_to.energy)) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(memory_to);
                    }
                    else 
                    {
                        //we only need to transfer once!
                        creep.memory.energyTo = null;
                    }
            }
            else {
                
                creep.memory.timeToWait = Game.time + 10;
                //console.log("Distributor nothing to do!");
                //creep.memory.recharging = true;
                //if(creep.room.storage){
                //    creep.memory.energyTo = creep.room.storage.id;
                //}
                //else 
                //{
                    creep.memory.recharge = true;
                //}
            }
        }
    }
};

module.exports = roleDistributer;