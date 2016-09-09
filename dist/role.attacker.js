var roleAttacker = {
    
    bodyparts: function(max_energy){
        return [
                TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
                TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,
                MOVE,MOVE,MOVE,MOVE,MOVE,
                MOVE,MOVE,MOVE,MOVE,MOVE,
                //ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,
                //ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,
                ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,
                ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,
                HEAL,MOVE,
                ];
    },
    initMemory: function(){
        return {
            role:"attacker",
            homeFlag:"Flag7",
            targetFlag:"Flag5",
            enemies:[],
            status : 0
        };
    },

    /** @param {Creep} creep **/
    run: function(creep) {
        
        
        if(!creep.memory.status){
            creep.moveTo(Game.flags[creep.memory.homeFlag]);
            var range =  creep.pos.getRangeTo(Game.flags[creep.memory.homeFlag]);
            if(range < 10){
                console.log("Attack ready!");
                creep.memory.status = 1;
            }
        }
        if(creep.memory.status == 1){
            if(creep.room.memory.countCreeps.attacker >=0)
            {
                console.log("Attacker on the way!");
                creep.memory.status = 2;
            }
        }
        if(creep.memory.status == 2)
        {
            creep.moveTo(Game.flags[creep.memory.targetFlag]);
            var range =  creep.pos.getRangeTo(Game.flags[creep.memory.targetFlag]);
            if(range <  1)
            {
                console.log("Attacker start to attack!");
                    creep.memory.status = 3;
            }
            
        }
        if(creep.memory.status == 3)
        {
            
            // creep.memory.enemies = ['57962f3eebbbd5c265485956'];
            if(Game.time % 5 == 0)
            {
                creep.say("LONG LIVE");
            }    
            else if(Game.time % 5 == 1)
            {
                creep.say("THE EMPEROR");
            }
            else if(Game.time % 5 == 2)
            {
                creep.say("UMINGO");
            }
            else if(Game.time % 5 == 2)
            {
                creep.say("...");
            }
            else if(Game.time % 5 == 2)
            {
                creep.say("......");
            }
            var target = Game.getObjectById(creep.memory.enemies[0]);
            if(target) 
            {
                if(creep.attack(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
            else if(creep.memory.enemies.length)
            {
                creep.memory.enemies.shift();
            }
            else {
                creep.memory.status = 4;
            }
        }
        
             //creep.memory.status =  2;
             //creep.memory.targetFlag = "Flag5";
        if(creep.memory.status == 4)
        {
          var target_creep = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
          var target_struc = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES,{
           filter: function(object) {
                    return object.structureType != STRUCTURE_WALL && !object.my;
                }
        }
          );
          //console.log(target2);
          //target2 = Game.getObjectById('5796f21433e0a1e14244f31d');
         
            //console.log(target2);
            
            if(target_creep) {
                    //console.log(creep.attack(target_creep) );
                if(creep.attack(target_creep) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target_creep);
                    creep.heal(creep);
                    //creep.attack(target2);
                }
            }
            else if(target_struc) {
                if(creep.attack(target_struc) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target_struc);
                    creep.heal(creep);
                }
            }
            else if(creep.hits < creep.hitsMax){
                   creep.heal(creep);
            }
            else {
                var target = creep.pos.findClosestByRange(FIND_MY_CREEPS, {
                    filter: function(object) {
                        return object.hits < object.hitsMax;
                    }
                });
                if(target) {
                    if(creep.heal(target) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(target);
                    }
                }
                
            }
        }
        
        /*
            var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if(target) {
                if(creep.attack(target) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(target);
                }
            }
            */
    }
};

module.exports = roleAttacker;