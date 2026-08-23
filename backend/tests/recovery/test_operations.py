import pytest
from app.recovery.operations import RecoveryOperationsController, RecoveryOperationStatus


def test_operations_controller_initial_running_state() -> None:
    controller = RecoveryOperationsController()
    controller.reset_for_tests()

    assert controller.status == RecoveryOperationStatus.RUNNING
    assert controller.can_execute_new_jobs() is True


def test_operations_controller_pause_blocks_new_jobs() -> None:
    controller = RecoveryOperationsController()
    controller.reset_for_tests()

    controller.pause(reason="Maintenance", actor="TEST_OPERATOR")
    assert controller.status == RecoveryOperationStatus.PAUSED
    assert controller.can_execute_new_jobs() is False


def test_operations_controller_resume_restores_running_state() -> None:
    controller = RecoveryOperationsController()
    controller.reset_for_tests()

    controller.pause()
    assert controller.can_execute_new_jobs() is False

    controller.resume()
    assert controller.status == RecoveryOperationStatus.RUNNING
    assert controller.can_execute_new_jobs() is True


def test_operations_controller_stop_blocks_execution() -> None:
    controller = RecoveryOperationsController()
    controller.reset_for_tests()

    controller.stop(reason="Emergency stop")
    assert controller.status == RecoveryOperationStatus.STOPPED
    assert controller.can_execute_new_jobs() is False
