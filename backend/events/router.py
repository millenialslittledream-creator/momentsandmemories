from typing import List
from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
from events.schemas import CreateEventRequest, UpdateEventRequest, InviteeIn
from events import service

router = APIRouter(prefix="/events", tags=["events"])


@router.post("", status_code=201)
def create_event(data: CreateEventRequest, current_user: dict = Depends(get_current_user)):
    return service.create_event(current_user["sub"], data)


@router.get("")
def list_events(current_user: dict = Depends(get_current_user)):
    return service.list_events(current_user["sub"])


@router.get("/{event_id}")
def get_event(event_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return service.get_event(current_user["sub"], event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{event_id}")
def update_event(event_id: str, data: UpdateEventRequest, current_user: dict = Depends(get_current_user)):
    try:
        return service.update_event(current_user["sub"], event_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{event_id}")
def delete_event(event_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return service.delete_event(current_user["sub"], event_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{event_id}/invitees", status_code=201)
def add_invitees(event_id: str, invitees: List[InviteeIn], current_user: dict = Depends(get_current_user)):
    return service.add_invitees(event_id, invitees)


@router.get("/{event_id}/invitees")
def list_invitees(event_id: str, current_user: dict = Depends(get_current_user)):
    return service.list_invitees(event_id)


@router.delete("/{event_id}/invitees/{invitee_id}")
def remove_invitee(event_id: str, invitee_id: str, current_user: dict = Depends(get_current_user)):
    return service.remove_invitee(event_id, invitee_id)
