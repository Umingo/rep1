var roleScavenger = {
    
    bodyparts: function(max_energy,energy){
        //console.log(max_energy);
        let parts = [CARRY,MOVE];
        let costs = BODYPART_COST.carry + BODYPART_COST.move;
        
        let minsteps = 2;
        let maxsteps = 6;
        
        let step_parts = [WORK]
        let step_costs = BODYPART_COST.work;
        //roads = 2 parts and 1 move part!
        for(let i = 0; i < minsteps || (i < maxsteps &&  costs + step_costs < max_energy);i++){
            parts.push.apply(parts, step_parts);
            costs +=  step_costs;
        }
        return parts;
    },
    initMemory: function(){
        return {
            role:"scavenger",
            isAtSource:false,
            targetSource:null,
            targetContainer:null
        };
    },
    
    /** @param {Creep} creep **/
    wait: function(creep){
        if(creep.memory.timeToWait && creep.memory.timeToWait > Game.time){
            return true;
        }
        return false
        
    },
    sleep: function(creep,ticks){
        creep.memory.timeToWait = Game.time + ticks;
        return creep.memory.timeToWait;
    },

    /** @param {Creep} creep **/
    run: function(creep) {
        
        if(this.wait(creep)){
            return;
        }
        if(!creep.memory.isAtSource)
        {
            
            //check for free container
            if(!creep.memory.targetSource)
            {
                 var targets = creep.room.find(FIND_SOURCES, 
                    {
                        filter: (structure) => 
                        {
                            if(!structure.room.memory.sources){
                                structure.room.memory.sources = {};
                            }
                            if(!structure.room.memory.sources[structure.id] || !structure.room.memory.sources[structure.id].occupied){
                                return true;
                            }
                            if(structure.room.memory.sources[structure.id].occupied < Game.time -20){
                                return true;
                            }
                            //check if sc is already dead
                            if(!Game.getObjectById(structure.room.memory.sources[structure.id].occupier)){
                                return true;
                            }
                        }
                    });
                       
                if(targets.length > 0) 
                {
                    var target = creep.pos.findClosestByPath(targets);
                    if(target)
                    {
                        creep.memory.targetSource = target.id;    
                        target.room.memory.sources[target.id] = {};
                        target.room.memory.sources[target.id].occupied = Game.time + creep.ticksToLive;
                        target.room.memory.sources[target.id].occupier = creep.id;
                    }
                    
                }
            }
                    
            var source = Game.getObjectById(creep.memory.targetSource);
            if(!!source && creep.pos.getRangeTo(source) < 2)
            {
                creep.say("SC COOL")
                creep.memory.isAtSource = true;
            }
            else 
            {
                creep.say("SC ON WAY")
                //console.log("Scavenger move to " + creep.memory.targetContainer + " distance: " + range);
                creep.moveTo(source);
            }
            return;
        }
                
            
        if(creep.carry.energy < creep.carryCapacity) 
        {
            if(creep.memory.targetContainer == null)
            {
                var containersLowEnergy = creep.pos.findInRange(FIND_STRUCTURES,3, {
                    filter: (i) => i.structureType == STRUCTURE_CONTAINER && 
                                   i.store[RESOURCE_ENERGY] < i.storeCapacity
                });
                var sources = creep.room.find(FIND_SOURCES);
                var container =  creep.pos.findClosestByPath(containersLowEnergy);
                if(container){
                    creep.memory.targetContainer = container.id;
                }
                
            }

            var harvestSource = Game.getObjectById(creep.memory.targetSource); 
            let errcode = creep.harvest(harvestSource);
            if(errcode == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(harvestSource,{reusePath:10});
            }
            else if(errcode == ERR_NOT_ENOUGH_RESOURCES){
                creep.memory.timeToWait = Game.time + harvestSource.ticksToRegeneration - 1;
                if(harvestSource.ticksToRegeneration > creep.ticksToLive){
                    creep.suicide();
                }
            }
            
        }
        //6 workparts -> 12 ressources ... 
        if(creep.carry.energy + 12  > creep.carryCapacity) {
            
                var container = Game.getObjectById(creep.memory.targetContainer);
                if(!container){
                    //better luck next round!
                    creep.memory.targetContainer = null;
                    creep.drop(RESOURCE_ENERGY);
                    return;
                    
                }
                var errcode = creep.transfer(container, RESOURCE_ENERGY,Math.min(creep.carry.energy,container.energyCapacity - container.energy));
                if(errcode == ERR_NOT_IN_RANGE)
                {
                    console.log("Scavenger has problems!");
                    creep.say("PROBLEM")
                    creep.moveTo(container,{reusePath:10});
                }
                else if(errcode == ERR_FULL){
                    creep.drop(RESOURCE_ENERGY);
                }
            }
        }
    
};

module.exports = roleScavenger;