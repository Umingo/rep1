var roleHarvester2 = {


    bodyparts: function(max_energy){
        
        //console.log(max_energy);
        if (max_energy <= 500)
        {
            return null;
            //return [WORK,MOVE,CARRY,MOVE];
        }
        //low min steps only wasted cpu ...
        let parts = [];
        let costs = 0;
        let minsteps = 6;
        let maxsteps = 6;
        
        let step_parts = [WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE]
        let step_costs = 1*BODYPART_COST.work + 3*BODYPART_COST.carry + 4*BODYPART_COST.move;
        //roads = 2 parts and 1 move part!
        for(let i = 0; i < minsteps || (i < maxsteps &&  costs + step_costs < max_energy);i++){
            parts.push.apply(parts, step_parts);
            costs +=  step_costs;
        }
        console.log("KOSTEN: " + costs);
        console.log(parts);
        return parts;
    },
    initMemory: function(){
        
        var targetFlags = [];
        var homeFlags = [];
       
        //console.log("RANDOM TARGET FLAG " + targetFlags[target_ran]);
        return {
            role:"harvester2",
            state:0,
            home: null,
            target: null,
            stats_energy:0,
            targetSource : null,
            targetStorage : null
        };
    },
    /** @param {Creep} creep **/
    wait: function(creep){
        if(creep.memory.timeToWait && creep.memory.timeToWait > Game.time){
            return true;
        }
        return false
        
    },
    /** @param {Creep} creep **/
    newExpansionHarvest: function(creep){
        
        var home_ran = null;
        if(!!creep.memory.home){
            home_ran == creep.memory.home;
        }
        var target_ran = null;
        var targetFlags = [];
        var homeFlags = [];
            //NEW RANDOM TARGET FLAG 
             for(var name in Game.flags){
            var flag = Game.flags[name];
            if(flag.color == COLOR_RED){
                targetFlags.push(name);
            }
            if(flag.color == COLOR_BLUE){
                homeFlags.push(name);
                if(home_ran == null && flag.room.name == creep.room.name){
                    home_ran = name;
                }
            }
        }
        if(home_ran == null){
            home_ran = homeFlags[Math.floor(Math.random()*10*homeFlags.length)%homeFlags.length];
        }
        if(target_ran == null){
            target_ran = targetFlags[Math.floor(Math.random()*10*targetFlags.length)%targetFlags.length];
        } 
        
        creep.memory.target = target_ran;
        creep.memory.home = home_ran;
                        
                        
                        
        
    },
    
    /** @param {Creep} creep **/
    returnEnergy: function(creep){
            //console.log("FIRST LEAVE ENERGY");
            
            //SEARCH AND CACHE STORAGE!
            if(creep.room.storage)
            {
                var storage = creep.room.storage;
                //too much energy = error ...
                transferAmount = Math.min(creep.carry.energy,storage.storeCapacity - storage.store[RESOURCE_ENERGY]);
                var errcode = creep.transfer(storage, RESOURCE_ENERGY,transferAmount);
                if(errcode == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(storage,{reusePath:15});
                }
                else if(errcode == OK) {
                    console.log("LOG " + transferAmount);
                    this.collected(creep,transferAmount);
                }
                return;
            }
              
            var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
            if(targets.length) 
            {
                var target = creep.pos.findClosestByRange(targets);
                if(creep.build(target) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(target,{reusePath:15});
                }
            }
            else if(creep.room.controller && creep.room.controller.my) 
            {
                if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(creep.room.controller,{reusePath:15});
                }
            }
            else {
                creep.drop(RESOURCE_ENERGY);
            }
                    
        
    },
    
    /** @param {Creep} creep **/
    walkToTarget: function(creep){
         if(Game.flags[creep.memory.target])
         {
            creep.moveTo(Game.flags[creep.memory.target],{reusePath:15});
            if( Game.flags[creep.memory.target].room && creep.room.name == Game.flags[creep.memory.target].room.name)
            {
                creep.memory.state = 2;
            }
        }
        else {
                creep.memory.state = 2;
        }
        
    },
    collected: function(creep,amount){
        if(!!amount){
            creep.memory.stats_energy = (creep.memory.stats_energy || 0) + amount;
            console.log("H2 ADD " + amount + " Total " + creep.memory.stats_energy);
        }
        return creep.memory.stats_energy;
    },
    
    /** @param {Creep} creep **/
    harvestTarget: function(creep){

  /*var target = creep.pos.findClosestByRange(FIND_STRUCTURES, 
	            {filter: {structureType: STRUCTURE_WALL}}
	            );
            if(target) {
                if(creep.dismantle(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);    
                }
            }*/
            //SEARCH AND CACHE TARGETSOURCE
             if(creep.memory.targetSource == null)
            {
                var sources = creep.room.find(FIND_SOURCES,
                {
                        filter: (source) => {
                            return (source.energy > 0 || source.ticksToRegeneration < 25);
                        }
                });
                var source = creep.pos.findClosestByPath(sources);
                if(source != null)
                {
                    creep.memory.targetSource = source.id;
                }
            }
            if(creep.memory.targetSource != null)
            {
                var memory_source = Game.getObjectById(creep.memory.targetSource);
                if(memory_source && (Math.abs(memory_source.pos.x - creep.pos.x) >1  || (Math.abs(memory_source.pos.y - creep.pos.y) >1)))
                {
                    creep.moveTo(memory_source,{reusePath:15});
                }
                else {
                    var errcode = creep.harvest(memory_source);
                    if(errcode == ERR_NOT_IN_RANGE) 
                    {
                        console.log("HARVEST2 NOT POSSIBLE");
                    }
                    else if(errcode == ERR_NOT_ENOUGH_RESOURCES)
                    {
                        if(memory_source.ticksToRegeneration < 30){
                            creep.memory.timeToWait = Game.time + memory_source.ticksToRegeneration - 1;
                        }
                        else {
                            creep.memory.targetSource = null;
                        }
                    }
                }
               
            }

        
    },
    
    /** @param {Creep} creep **/
    goHome: function(creep){
            
             //console.log("GO HOME ROOM");
            if(global.moduleRoom.myRoom(creep.room))
            {
                
                if(creep.room.controller.level < 3 || creep.room.controller.ticksToDowngrade < 5000)
                {
                    //console.log("HARV2 UPGRADE");
                    if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(creep.room.controller,{reusePath:15});    
                    }
                    return;
                }
            }
            if(!creep.memory.buildcache && Game.time % 10 == 0)
            {
                var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                var target = creep.pos.findClosestByRange(targets);
                if(!!target){
                    creep.memory.buildcache = target.id;
                }
            }
            if(!!creep.memory.buildcache){
                var construction = Game.getObjectById(creep.memory.buildcache);
                if(!construction){
                    creep.memory.buildcache = null;
                }
                else if(creep.build(construction) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(construction,{reusePath:15});
                }
            }
            if(!creep.memory.buildcache)
            {
                creep.moveTo(Game.flags[creep.memory.home],{reusePath:15});
                if(Game.time % 5 == 0)
                {
                    var range =  creep.pos.getRangeTo(Game.flags[creep.memory.home]);
                    //CREEP HOME - NEW TARGET!
                    if(range < 10)
                    {
                        creep.memory.state = 4;
                        this.newExpansionHarvest(creep);
                        
                    }
                }
            }
    },
    /** @param {Creep} creep **/
    run: function(creep) {
        
        //all creeps go to ... 
         //   creep.memory.target = "Flag14";
         //   creep.memory.expanding = true;
         //   creep.memory.recharging = true;
            
        if(this.wait(creep))
        {
            return true;
        }
        
        if(!Game.flags[creep.memory.target] || !Game.flags[creep.memory.home])
        {
            this.newExpansionHarvest(creep);
        }
        //creep.memory.home = "Froom2";
        //creep.memory.target="Flag8";
        //creep.memory.targetStorage = null;
        //console.log("HARVESTER2");
        if(creep.memory.state >2 && creep.carry.energy == 0) {
            creep.memory.state = 1;
            
            //just die if you cannot go another round!
            if(creep.ticksToLive < 100){
                creep.suicide();
            }
            //reset cache ... 
            creep.memory.targetSource = null;
            //console.log("New Random Target: " + creep.memory.target);
            //console.log(targetFlags);
            
        }
        if(creep.memory.state < 3 && creep.carry.energy == creep.carryCapacity) {
            creep.memory.state = 3;
        }
        
        //GO TO EXTERN FLAG
        if(creep.memory.state == 1) {
            this.walkToTarget(creep);
        }
        //HARVEST NEAR EXTERN FLAG
        else if(creep.memory.state == 2){
            this.harvestTarget(creep);
        }
        //GO TO BLUE FLAG HOME
        else if(creep.memory.state == 3)
        {
            this.goHome(creep);
            
        }
        //RETURN ENERGY ...
        else if(creep.memory.state == 4)
        {
            this.returnEnergy(creep);
        }
        else 
        {
            creep.memory.state = 1;
        }
        
        if(Game.time % 5 == 0){
            creep.say("E: " + this.collected(creep));
        }
        if(Game.time % 5 == 1){
            creep.say("L: " + creep.ticksToLive);
        }
        
        if(Game.time % 5 == 2){
            creep.say("H: "+creep.memory.home);
        }
        if(Game.time % 5 == 3){
            creep.say("T: "+ creep.memory.target);
        }
        if(Game.time % 5 == 4){
            creep.say("S: "+ (creep.memory.state));
        }
    }
};

module.exports = roleHarvester2;