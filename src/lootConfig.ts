export const DROP_RANGES: Record<string, [number, number]> = {
  COMMON: [0,50],
  UNCOMMON: [51,100],
  RARE: [101,150],
  EPIC: [151,200],
  LEGENDARY: [201,255]
};

export const CHEST_SETTINGS:any = {

  COMMON:{
    items:[1,3],

    lootTable:{
      colorDrop:93,
      chest:2,
      color:5,
      boost: 3
    },

    allowedDropRarities:["COMMON","UNCOMMON"]
  },

  UNCOMMON:{
    items:[2,5],

    lootTable:{
      colorDrop:85,
      chest:3,
      color:7,
      boost: 5
    },

    allowedDropRarities:["COMMON","UNCOMMON","RARE"]
  },

  RARE:{
    items:[2,6],

    lootTable:{
      colorDrop:86,
      chest:4,
      color:10,
      boost: 7
    },

    allowedDropRarities:["COMMON","UNCOMMON","RARE","EPIC"]
  },

  EPIC:{
    items:[2,4],

    lootTable:{
      colorDrop:79,
      chest:4,
      color:10,
      boost: 7
    },

    allowedDropRarities:["RARE","EPIC","LEGENDARY"]
  },

  LEGENDARY:{
    items:[5,10],

    lootTable:{
      colorDrop:63,
      chest:5,
      color:25,
      boost: 7
    },

    allowedDropRarities:["EPIC","LEGENDARY"]
  }

};