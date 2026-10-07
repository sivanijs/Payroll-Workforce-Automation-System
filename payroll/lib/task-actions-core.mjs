export function canStartOrSubmitTask(user, task) {
  return Boolean(user && task && task.assignedToId === user.id);
}

export function canReviewTask(user, task) {
  if (!user || !task) {
    return false;
  }

  return user.role === "admin" || task.assignedById === user.id;
}
