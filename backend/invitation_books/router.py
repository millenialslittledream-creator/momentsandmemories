from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import get_current_user
from invitation_books.schemas import CreateInvitationBookRequest, UpdateInvitationBookRequest
from invitation_books import service

router = APIRouter(prefix="/invitation-books", tags=["invitation-books"])


@router.post("")
def create_book(data: CreateInvitationBookRequest, current_user: dict = Depends(get_current_user)):
    try:
        return service.create_invitation_book(current_user["sub"], data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
def list_books(current_user: dict = Depends(get_current_user)):
    return service.list_invitation_books(current_user["sub"])


@router.get("/{book_id}")
def get_book(book_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return service.get_invitation_book(current_user["sub"], book_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{book_id}")
def update_book(
    book_id: str,
    data: UpdateInvitationBookRequest,
    current_user: dict = Depends(get_current_user),
):
    try:
        return service.update_invitation_book(current_user["sub"], book_id, data)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{book_id}")
def delete_book(book_id: str, current_user: dict = Depends(get_current_user)):
    try:
        service.delete_invitation_book(current_user["sub"], book_id)
        return {"status": "deleted"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
