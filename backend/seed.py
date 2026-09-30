"""
backend/seed.py

Idempotent seed script to initialize demo users and encounters for CareFlow AI.
Ensures demo doctor and patient accounts exist so users can sign in immediately
with:
  Doctor:  doctor@hospital.com  / password123 / HOSP-AIIMS-CARDIO
  Patient: patient@hospital.com / password123
"""

import uuid
from datetime import datetime, timedelta
import logging

from backend.database import get_engine, _get_session_factory
from backend.models import Base
from backend.models.user import User, UserRole
from backend.models.patient import Patient
from backend.models.encounter import Encounter, EncounterStatus
from backend.models.intake_session import IntakeSession, IntakeSessionStatus
from backend.models.extracted_entity import ExtractedEntity, SourceType, VerificationStatus
from backend.models.clinical_summary import ClinicalSummary
from backend.auth.password import hash_password

logger = logging.getLogger(__name__)


def seed_demo_data():
    """Seeds demo doctor, patients, and encounters if they don't already exist."""
    # Ensure all tables exist first
    try:
        Base.metadata.create_all(bind=get_engine())
    except Exception as e:
        logger.warning("Could not auto-create tables: %s", e)
        return

    session_factory = _get_session_factory()
    db = session_factory()
    try:
        # 1. Doctor: doctor@hospital.com
        doctor = db.query(User).filter(User.email == "doctor@hospital.com").first()
        if not doctor:
            doctor = User(
                id=str(uuid.uuid4()),
                email="doctor@hospital.com",
                hashed_password=hash_password("password123"),
                full_name="Dr. Priya Sharma",
                role=UserRole.doctor,
                hospital_affiliation="HOSP-AIIMS-CARDIO",
                is_active=True,
            )
            db.add(doctor)
            db.flush()
            logger.info("Created demo doctor: doctor@hospital.com")
        else:
            # Ensure password and affiliation are aligned with demo
            doctor.hashed_password = hash_password("password123")
            doctor.role = UserRole.doctor
            doctor.hospital_affiliation = "HOSP-AIIMS-CARDIO"
            doctor.full_name = doctor.full_name or "Dr. Priya Sharma"
            db.flush()

        # 2. Patient: patient@hospital.com
        patient_user = db.query(User).filter(User.email == "patient@hospital.com").first()
        if not patient_user:
            patient_user = User(
                id=str(uuid.uuid4()),
                email="patient@hospital.com",
                hashed_password=hash_password("password123"),
                full_name="Ramesh Kumar",
                role=UserRole.patient,
                is_active=True,
            )
            db.add(patient_user)
            db.flush()
            logger.info("Created demo patient: patient@hospital.com")
        else:
            patient_user.hashed_password = hash_password("password123")
            db.flush()

        # 3. Patient Profile
        profile = db.query(Patient).filter(Patient.user_id == patient_user.id).first()
        if not profile:
            profile = Patient(
                id=str(uuid.uuid4()),
                user_id=patient_user.id,
                full_name="Ramesh Kumar",
                hospital_identifier="MRN-2026-0042",
                date_of_birth="1980-05-15",
                gender="male",
                phone="+91 98765 43210",
                preferred_language="en",
                demographics_json={
                    "blood_group": "B+",
                    "allergies": ["Penicillin"],
                    "emergency_contact": "+91 98765 43211",
                },
            )
            db.add(profile)
            db.flush()
            logger.info("Created patient profile for Ramesh Kumar")

        # 4. Secondary Patient: anita@hospital.com
        anita_user = db.query(User).filter(User.email == "anita@hospital.com").first()
        if not anita_user:
            anita_user = User(
                id=str(uuid.uuid4()),
                email="anita@hospital.com",
                hashed_password=hash_password("password123"),
                full_name="Anita Desai",
                role=UserRole.patient,
                is_active=True,
            )
            db.add(anita_user)
            db.flush()

            anita_profile = Patient(
                id=str(uuid.uuid4()),
                user_id=anita_user.id,
                full_name="Anita Desai",
                hospital_identifier="MRN-2026-0089",
                date_of_birth="1992-11-20",
                gender="female",
                phone="+91 91234 56789",
                preferred_language="en",
                demographics_json={"blood_group": "O+", "allergies": []},
            )
            db.add(anita_profile)
            db.flush()
        else:
            anita_profile = db.query(Patient).filter(Patient.user_id == anita_user.id).first()

        # 5. Encounter 1 for Ramesh Kumar (Ready for Doctor Review)
        existing_enc = db.query(Encounter).filter(Encounter.patient_id == profile.id).first()
        if not existing_enc:
            enc1 = Encounter(
                id=str(uuid.uuid4()),
                patient_id=profile.id,
                doctor_user_id=doctor.id,
                queue_status=EncounterStatus.ready_for_review,
                opd_department="Cardiology",
                scheduled_at=datetime.utcnow() - timedelta(minutes=45),
            )
            db.add(enc1)
            db.flush()

            intake1 = IntakeSession(
                id=str(uuid.uuid4()),
                encounter_id=enc1.id,
                language="en",
                schema_id="cardiology_general",
                status=IntakeSessionStatus.processed,
                answered_fields_json=["chief_complaint", "duration", "medication", "past_history"],
                turn_count="4",
            )
            db.add(intake1)
            db.flush()

            # Extracted entities
            entities = [
                ExtractedEntity(
                    id=str(uuid.uuid4()),
                    encounter_id=enc1.id,
                    source_type=SourceType.intake_session,
                    source_id=intake1.id,
                    source_location="turn:1",
                    field_name="chief_complaint",
                    value="Substernal chest pressure on exertion radiating to left arm",
                    confidence=0.94,
                    low_confidence_flag=False,
                    verification_status=VerificationStatus.unreviewed,
                ),
                ExtractedEntity(
                    id=str(uuid.uuid4()),
                    encounter_id=enc1.id,
                    source_type=SourceType.intake_session,
                    source_id=intake1.id,
                    source_location="turn:2",
                    field_name="onset",
                    value="3 days ago with worsening intensity",
                    confidence=0.88,
                    low_confidence_flag=False,
                    verification_status=VerificationStatus.unreviewed,
                ),
                ExtractedEntity(
                    id=str(uuid.uuid4()),
                    encounter_id=enc1.id,
                    source_type=SourceType.intake_session,
                    source_id=intake1.id,
                    source_location="turn:3",
                    field_name="medication",
                    value="Atorvastatin 20mg once daily at bedtime",
                    confidence=0.96,
                    low_confidence_flag=False,
                    verification_status=VerificationStatus.accepted,
                    reviewed_by=doctor.id,
                    reviewed_at=datetime.utcnow() - timedelta(minutes=10),
                ),
                ExtractedEntity(
                    id=str(uuid.uuid4()),
                    encounter_id=enc1.id,
                    source_type=SourceType.intake_session,
                    source_id=intake1.id,
                    source_location="turn:4",
                    field_name="diagnosis",
                    value="Known Essential Hypertension (diagnosed 2021)",
                    confidence=0.91,
                    low_confidence_flag=False,
                    verification_status=VerificationStatus.unreviewed,
                ),
            ]
            for ent in entities:
                db.add(ent)
            db.flush()

            # Clinical Summary
            summary = ClinicalSummary(
                id=str(uuid.uuid4()),
                encounter_id=enc1.id,
                summary_text=(
                    "46-year-old male presenting with 3-day history of exertional substernal chest discomfort "
                    "radiating to left arm. Known history of hypertension; currently on Atorvastatin 20mg daily. "
                    "No reported syncope, diaphoresis, or resting chest pain. Triage prioritized for Cardiology review."
                ),
                used_entity_fields=["chief_complaint", "onset", "medication", "diagnosis"],
            )
            db.add(summary)
            db.flush()
            logger.info("Seeded Cardiology encounter for Ramesh Kumar")

        # 6. Encounter 2 for Anita Desai
        if anita_profile:
            existing_enc2 = db.query(Encounter).filter(Encounter.patient_id == anita_profile.id).first()
            if not existing_enc2:
                enc2 = Encounter(
                    id=str(uuid.uuid4()),
                    patient_id=anita_profile.id,
                    doctor_user_id=doctor.id,
                    queue_status=EncounterStatus.ready_for_review,
                    opd_department="General Medicine",
                    scheduled_at=datetime.utcnow() - timedelta(minutes=15),
                )
                db.add(enc2)
                db.flush()

                intake2 = IntakeSession(
                    id=str(uuid.uuid4()),
                    encounter_id=enc2.id,
                    language="en",
                    schema_id="general_medicine",
                    status=IntakeSessionStatus.processed,
                    answered_fields_json=["chief_complaint", "duration"],
                    turn_count="2",
                )
                db.add(intake2)
                db.flush()

                summary2 = ClinicalSummary(
                    id=str(uuid.uuid4()),
                    encounter_id=enc2.id,
                    summary_text="34-year-old female presenting with low-grade fever and dry cough for 5 days. No red flags.",
                    used_entity_fields=["chief_complaint", "duration"],
                )
                db.add(summary2)
                db.flush()
                logger.info("Seeded General Medicine encounter for Anita Desai")

        db.commit()
        logger.info("Demo data seeding completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error("Failed to seed demo data: %s", e)
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
    print("Database seeded with demo users and encounters.")
