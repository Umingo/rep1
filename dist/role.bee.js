var roleHarvester = {


    bodyparts: function(max_energy,energy){
        
        if(energy < 300){
            return null;
        }
        //NOT MAX_ENERGY,BUT ENERGY TO GET THE BEST POSSIBLE AT THE MOMENT!
        let parts = [];//WORK,CARRY,CARRY,MOVE,MOVE];
        let costs = 0;//1*BODYPART_COST.work + 1* BODYPART_COST.move;
        let minsteps = 1;
        let maxsteps = 10;
        
        let step_parts = [WORK,CARRY,CARRY,MOVE,MOVE];
        let step_costs = 1*BODYPART_COST.work + 2*BODYPART_COST.carry + 2* BODYPART_COST.move;
        //roads = 2 parts and 1 move part!
        for(let i = 0; i < minsteps || (i < maxsteps &&  costs + step_costs < energy);i++){
            parts.push.apply(parts, step_parts);
            costs +=  step_costs;
        }
        console.log("BEE:" + energy + " => " + costs);
        console.log(JSON.stringify(parts));
        return parts;
        
    },
    initMemory: function(){
        return {
            role:"bee",
            recharging:1
            
        };
    },
    
    /** @param {Creep} creep **/
    wait: function(creep){
        if(creep.memory.timeToWait && creep.memory.timeToWait > Game.time){
            return true;
        }
        return false
        
    },
    
    getEnergyFromSource: function(creep){
        //OK NO CONTAINER -> HARVEST
        if(!creep.room.memory.sources){
            var sources = creep.room.find(FIND_SOURCES);
            creep.room.memory.sources = [];
            _.map(sources, function(source){ creep.room.memory.sources[source.id] = {}});
        }
        //no energy sources in the room
        if(!_.size(creep.room.memory.sources)){
            return false; 
        }
        var min_empty = ENERGY_REGEN_TIME;
        if(!creep.memory.source_now){
            
            let good_sources = [];
            for(let source_i in creep.room.memory.sources)
            {

                let mySource = Game.getObjectById(source_i);
            
                min_empty = Math.min(min_empty,mySource.ticksToRegeneration);
                if(mySource.energy > 200){
                    
                    let harvesting_creeps = mySource.pos.findInRange(FIND_CREEPS, 2);
                    if(harvesting_creeps.length > 2) {
                        continue;
                    }
                    good_sources.push(mySource);
                }
            }
            let final_source = creep.pos.findClosestByPath(good_sources);
            
            //console.log(good_sources);
            //console.log("good_source: " + final_source);
            if(final_source){
                creep.memory.source_now = final_source.id;
            }
        }
            
        if(creep.memory.source_now){
            var mySource = Game.getObjectById(creep.memory.source_now);
            if(creep.harvest(mySource) == ERR_NOT_IN_RANGE) {
                creep.moveTo(mySource,{reusePath:10});
                //check if source is full ...
                if(Game.time % 25 == 0){
                    if(mySource.pos.findInRange(FIND_CREEPS, 2).length > 2) {
                        creep.memory.source_now = null;
                    }
                }
            }
            if(mySource.energy == 0){
                creep.memory.source_now = null;
            }
        }
        else {
            creep.memory.timeToWait = Game.time + min_empty;
        }
        return !!creep.memory.source_now;
    },
    
    getEnergyNoSource : function(creep){
        if(!creep.memory.energyFrom)
        {
            var pickupjob_id =global.moduleRoom.getPickupjob(creep.room,creep.carryCapacity);
            var sources = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return ((structure.structureType == STRUCTURE_CONTAINER) && structure["store"] && structure.store[RESOURCE_ENERGY] > 100)
                }
            });
            if(pickupjob_id != null){
                    creep.memory.energyFrom = pickupjob_id;  
                    creep.memory.isPickup = true;
            }
            else if(sources.length > 0){
                
                var source = sources[(Math.floor(Math.random() * 10 * sources.length))%sources.length];
                if(source != null){
                    creep.memory.energyFrom = source.id;     
                    creep.memory.isPickup = false;
                }
            }
            else
            {
                return false;
            }
        }
                
        if(!!creep.memory.energyFrom)
        {
            var memory_source = Game.getObjectById(creep.memory.energyFrom);
            if(memory_source == null)
            {
                creep.memory.energyFrom = null;
            }
            else if(creep.memory.isPickup)
            {
                var err = creep.pickup(memory_source);
                if(err = ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(memory_source,{reusePath:12});
                }
                else {
                    //global.moduleRoom.clearPickupjob(creep.room,memory_source);
                    creep.memory.energyFrom = null;
                    return true;
                }
            }
            else 
            {
                if(memory_source.store[RESOURCE_ENERGY] == 0)
                {
                    creep.memory.energyFrom = null;
                }
                else 
                {
                    var toWithdraw = Math.min(memory_source.store[RESOURCE_ENERGY], creep.carryCapacity - creep.carry.energy);
                    if(memory_source.store[RESOURCE_ENERGY] == 0)
                    {
                        creep.memory.energyFrom = null;
                    }
                    var errcor = creep.withdraw(memory_source,RESOURCE_ENERGY,toWithdraw) 
                    if(errcor == ERR_NOT_IN_RANGE) 
                    {
                        creep.moveTo(memory_source,{reusePath:12});
                    }
                    else if(errcor == OK)
                    {
                        creep.memory.energyFrom = null;
                        return true;
                    }
                    else {
                        creep.memory.energyFrom = null;
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
        
    },
    /** @param {Creep} creep **/
    run: function(creep) {
        
        if(this.wait(creep))
        {
            return true;
        }
        //creep.suicide();
        
        if((creep.memory.recharging || 0) < 1 && creep.carry.energy == 0) {
            creep.memory.recharging = 1;
        }
        if(creep.memory.recharging > 0 && creep.carry.energy == creep.carryCapacity) {
            creep.memory.recharging = 0;
        }
        creep.say("R: " + creep.memory.recharging);
        if(creep.memory.recharging > 0) {
            
            //creep.memory.recharging = 1;
            //check for container first and every 10 ticks!
            if(creep.memory.recharging == 1){
                if(!this.getEnergyNoSource(creep)){
                    creep.memory.recharging = 2;
                }
            }
            if(creep.memory.recharging == 2){
                if(!this.getEnergyFromSource(creep)){
                    creep.memory.recharging = 1;
                    
                };
            }
        }
        else 
        {
            if(creep.memory.recharging == 0)
            {
                 var targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return ((structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) && structure.energy < structure.energyCapacity)
                                     || (structure.structureType == STRUCTURE_TOWER && structure.energy*2 < structure.energyCapacity);
                        }
                });
                if(targets.length > 0) 
                {
                    var target = creep.pos.findClosestByRange(targets);
                    creep.memory.target_id = target.id;
                    creep.memory.recharging = -1;
                }
                else  if(creep.room.controller.ticksToDowngrade < 5000){
                    creep.memory.recharging = -2;
                }
                else {
                    var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                    if(targets.length) 
                    {
                        var target = creep.pos.findClosestByRange(targets);
                        if(target != null){
                            creep.memory.build_structure = target.id;
                            creep.memory.recharging = -3;
                        }
                    }
                    else {
                        creep.memory.recharging = -4;
                    }
                }
                
            }
            
            if(creep.memory.recharging == -1){
                var target = Game.getObjectById(creep.memory.target_id)
                if(!target){
                    creep.memory.target_id = null;
                    creep.memory.recharging = 0;
                    return;
                }
                if(target.energyCapacity && target.energyCapacity == target.energy){
                    creep.memory.target_id = null;
                    creep.memory.recharging = 0;
                    return;
                }
                else {
                    //too much energy = error ...
                    var err_code  = creep.transfer(target, RESOURCE_ENERGY,Math.min(creep.carry.energy,target.energyCapacity - target.energy));
                    if(err_code == ERR_NOT_IN_RANGE)
                    {
                        creep.moveTo(target,{reusePath:10});
                    }
                    else{//(err_code == OK){
                        creep.memory.target_id = null;
                        creep.memory.recharging = 0;
                    }
                }
            }
            else if(creep.memory.recharging == -2)
            {
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller,{reusePath:15});    
                }
            }
            else if(creep.memory.recharging == -3)
            {
                var memory_building = Game.getObjectById(creep.memory.build_structure);
                if(memory_building == null){
                    creep.memory.build_structure = null;
                    creep.memory.recharging = 0;
                    return;
                }
                else if(creep.build(memory_building) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(memory_building,{reusePath:15});
                }
                
            }
            else if(creep.memory.recharging == -4)
            {
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller,{reusePath:15});    
                }   
            }
            else {
                console.log("UNKNOWN RECHARGE MODE: " + creep.memory.recharging);
                creep.memory.recharging = 0;
            }
        }
    }
};

module.exports = roleHarvester;