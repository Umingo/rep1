var roleTransporter = {

    bodyparts: function(max_energy,energy){
        
        let parts = [];
        let costs = 0;
        let minsteps = 2;
        let maxsteps = 10;
        
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
            role:"transporter",
            recharging:true,
            energyFrom:null,
            energyTo:null,
            isPickup: false
        };
    },
    /** @param {Creep} creep **/
    run: function(creep) {
        
        if(creep.memory.tickToWait && creep.memory.tickToWait > Game.time){
            return;
        }
        if(!creep.memory.recharging && creep.carry.energy == 0) {
            creep.memory.recharging = true;
            creep.memory.energyFrom = null;
        }
        //70% is enough to go back
        //case: you dont want to run to a container if you only have little space left!
        //most of the time you get one huge load from a container and are full or at least decent full
        if(creep.memory.recharging && creep.carry.energy > 0.8 * creep.carryCapacity) {
            creep.memory.recharging = false;
        }
        //if you nearly dead ... just give your energy and die in peace :) 
        if(creep.ticksToLive < 50){
            creep.memory.recharging = false;
        }
        
        if(creep.memory.recharging) 
        {
            if(creep.memory.energyFrom ==  null)
            {
                var pickupjob_id =global.moduleRoom.getPickupjob(creep.room,creep.carryCapacity);
                var containers = creep.room.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return ((structure.structureType == STRUCTURE_CONTAINER) && structure["store"] &&  _.reduce(structure.store, function(memo, num){ return memo + num; }, 0) > 100)
                    }
                });
                if(pickupjob_id != null){
                        creep.memory.energyFrom = pickupjob_id;  
                        creep.memory.isPickup = true;
                }
                else if(containers.length > 0){
                    
                    var container = containers[(Math.floor(Math.random() * 10 * containers.length))%containers.length];
                    if(container != null){
                        creep.memory.energyFrom = container.id;     
                        creep.memory.isPickup = false;
                    }
                }
                else
                {
                    creep.memory.tickToWait = Game.time + 10;
                }
            }
                    
            if(creep.memory.energyFrom !=  null)
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
                    }
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
                    else if(errcor != OK)
                    {
                        creep.memory.energyFrom = null;
                    }
                }
            }
        }
        else if(creep.room.storage)
        {
            
            var memory_to = creep.room.storage;
            if(memory_to != null && creep.transfer(memory_to, RESOURCE_ENERGY,Math.min(creep.carry.energy,memory_to.energyCapacity - memory_to.energy)) == ERR_NOT_IN_RANGE) 
            {
                creep.moveTo(memory_to,{reusePath:12});
            }
        }
    }
};

module.exports = roleTransporter;