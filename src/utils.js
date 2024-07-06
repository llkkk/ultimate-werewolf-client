const saveRoomToLocalStorage = (roomID) => {
    const now = new Date();
    const newRoom = { roomID, joinTime: now.toISOString() };
  
    const storedRooms = JSON.parse(localStorage.getItem('recentRooms')) || [];
    const updatedRooms = [newRoom, ...storedRooms.filter(room => room.roomID !== roomID)].slice(0, 5);
    console.log(storedRooms,updatedRooms)
    localStorage.setItem('recentRooms', JSON.stringify(updatedRooms));
    // setRecentRooms(updatedRooms);
  };

  export function removeRecentRoom(roomID) {
    const storedRooms = JSON.parse(localStorage.getItem('recentRooms')) || [];
    const updatedRooms = [...storedRooms.filter(room => room.roomID !== roomID)].slice(0, 5);
    console.log(storedRooms,updatedRooms)
    localStorage.setItem('recentRooms', JSON.stringify(updatedRooms));
  };
  export default saveRoomToLocalStorage;
