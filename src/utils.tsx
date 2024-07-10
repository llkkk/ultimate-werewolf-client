import { Room } from './types/room.ts';

const saveRoomToLocalStorage = (roomID: string) => {
  const now = new Date();
  const newRoom = { roomID, joinTime: now.toISOString() };

  const storedRooms: Room[] = JSON.parse(
    localStorage.getItem('recentRooms') || '[]',
  ) as Room[];
  const updatedRooms = [
    newRoom,
    ...storedRooms.filter((room) => room.roomID !== roomID),
  ].slice(0, 5);
  console.log(storedRooms, updatedRooms);
  localStorage.setItem('recentRooms', JSON.stringify(updatedRooms));
};

export function removeRecentRoom(roomID: string) {
  const storedRooms: Room[] = JSON.parse(
    localStorage.getItem('recentRooms') || '[]',
  ) as Room[];
  const updatedRooms = [
    ...storedRooms.filter((room) => room.roomID !== roomID),
  ].slice(0, 5);
  console.log(storedRooms, updatedRooms);
  localStorage.setItem('recentRooms', JSON.stringify(updatedRooms));
}
export default saveRoomToLocalStorage;
