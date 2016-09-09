var roleClaimer = {
    
    bodyparts: function(max_energy, energy){
        //console.log("A" + max_energy + " - " + energy);
        if(max_energy < 1300)
        {
            return [CLAIM,MOVE];
        }
        return [CLAIM,MOVE];
    },
    initMemory: function(){
        return {
            role:"claimer",
            targetFlag:"Flag1",
            targetReached:false,
            targetCapture:false
        };
    },

    /** @param {Creep} creep **/
    run: function(creep) {
        
        if(!creep.memory.targetReached){
            //console.log("Claimer Moving!");
            creep.moveTo(Game.flags[creep.memory.targetFlag]);
            //console.log(creep.moveTo(creep.room.rooms["W13N44"]));
            var range =  creep.pos.getRangeTo(Game.flags[creep.memory.targetFlag]);
            if(range < 5){
                creep.memory.targetReached = true;
            }
            
        }
        else if(creep.room.controller) 
        {
            
            if(creep.memory.targetCapture)
            {
                if(creep.claimController(creep.room.controller) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(creep.room.controller,{reusePath:20});
                }
            } 
            else 
            {
                if(creep.reserveController(creep.room.controller) == ERR_NOT_IN_RANGE) 
                {
                    creep.moveTo(creep.room.controller,{reusePath:20});    
                }
            }
        }
    }
};

module.exports = roleClaimer;