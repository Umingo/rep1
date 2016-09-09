var roleBuilder = {


    bodyparts: function(max_energy){
        
        let parts = [];
        let costs = 0;
        let minsteps = 2;
        let maxsteps = 4;
        
        let step_parts = [WORK,CARRY,CARRY,MOVE,MOVE,MOVE]
        let step_costs = 1*BODYPART_COST.work + 2*BODYPART_COST.carry + 3*BODYPART_COST.move;
        //roads = 2 parts and 1 move part!
        for(let i = 0; i < minsteps || (i < maxsteps &&  costs + step_costs < max_energy);i++){
            parts.push.apply(parts, step_parts);
            costs +=  step_costs;
        }
        return parts;
    },
    initMemory: function(){
        return {
            role:"builder",
            building:false,
            build_structure:null,
            toHeal:null,
            fromSource:null
            
        };
    },
    
    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.timeToWait && creep.memory.timeToWait > Game.time){
            return;
        }
        
        if(creep.memory.building && creep.carry.energy == 0) {
            creep.memory.building = false;
            creep.memory.toHeal = null;
        }
        if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
            creep.memory.building = true;
            creep.memory.fromSource = null;
        }

        if(creep.memory.building) 
        {
            
            //just check if anything still needs heal!
            if(Game.time % 50 == 1)
            {
                var closestDamagedStructure = creep.pos.findClosestByRange(FIND_STRUCTURES, 
                {
                    filter: (structure) => 
                        (structure.structureType == STRUCTURE_CONTAINER && structure.hits < structure.hitsMax -20000) || 
                        (structure.hits  < structure.hitsMax/2 && structure.hits < 30000)
                    
                });
                if(closestDamagedStructure) 
                {
                    creep.memory.toHeal = closestDamagedStructure.id;
                }
                else 
                {
                    creep.memory.toHeal = null;
                }
            }
            if(creep.memory.toHeal != null)
            {
                var memory_heal = Game.getObjectById(creep.memory.toHeal);
                
                if(memory_heal == null)
                {
                    creep.memory.toHeal = null;
                }
                else if(creep.repair(memory_heal) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(memory_heal,{reusePath:15});
                }

            }

            else 
            {
                //console.log("building!");
                if(creep.memory.build_structure == null)
                {
                    
                    var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                    if(targets.length) 
                    {
                        var target = creep.pos.findClosestByRange(targets);
                        if(target != null){
                            creep.memory.build_structure = target.id;
                        }
                    }
                }
                
                if(creep.memory.build_structure != null)
                {
                    var memory_building = Game.getObjectById(creep.memory.build_structure);
                    if(memory_building == null){
                        creep.memory.build_structure = null;
                    }
                    else if(creep.build(memory_building) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(memory_building,{reusePath:15});
                    }
                    
                }
                else {
                    creep.memory.timeToWait = Game.time + 15;
                }
            }
        }
        else 
        {
            if(creep.memory.fromSource == null)
            {
                 var sources = creep.room.find(FIND_STRUCTURES, 
                 {
                        filter: (structure) => 
                        {
                            return ((structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) && structure["store"] && structure.store[RESOURCE_ENERGY] > 250);
                        }
                });
                if(sources.length > 0)
                {
                    
                    var source = creep.pos.findClosestByPath(sources);
                    if(source)
                    {
                        creep.memory.fromSource = source.id;
                    }
                }
            }
            
            if(creep.memory.fromSource != null)
            {
                var source_obj = Game.getObjectById(creep.memory.fromSource);
                if(source_obj == null){
                    creep.memory.fromSource = null;
                }
                else if(creep.withdraw(source_obj,RESOURCE_ENERGY,Math.min(source_obj.store[RESOURCE_ENERGY], creep.carryCapacity - creep.carry.energy)) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(source_obj,{reusePath:15});
                }
            }
        
        }
    }
};

module.exports = roleBuilder;